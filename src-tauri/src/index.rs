use crate::models::*;
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use parking_lot::RwLock;
use rayon::prelude::*;
use regex::Regex;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::time::Instant;
use walkdir::WalkDir;

pub struct FileIndex {
    pub files: Arc<RwLock<Vec<IndexedFile>>>,
    index_paths: RwLock<Vec<String>>,
    progress: RwLock<IndexProgress>,
    is_indexing: RwLock<bool>,
    matcher: SkimMatcherV2,
    cache_dirty: RwLock<bool>,
}

fn cache_file_path() -> Option<PathBuf> {
    if let Some(data_dir) = dirs::data_local_dir() {
        let dir = data_dir.join("FinderAll");
        std::fs::create_dir_all(&dir).ok()?;
        Some(dir.join("index_cache.bin"))
    } else {
        None
    }
}

impl FileIndex {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            files: Arc::new(RwLock::new(Vec::new())),
            index_paths: RwLock::new(Vec::new()),
            progress: RwLock::new(IndexProgress::default()),
            is_indexing: RwLock::new(false),
            matcher: SkimMatcherV2::default().ignore_case(),
            cache_dirty: RwLock::new(false),
        })
    }

    pub fn mark_cache_dirty(&self) {
        *self.cache_dirty.write() = true;
    }

    pub fn save_cache_if_dirty(&self) -> bool {
        let mut dirty = self.cache_dirty.write();
        if *dirty {
            *dirty = false;
            self.save_cache()
        } else {
            false
        }
    }

    pub fn load_from_cache(self: &Arc<Self>) -> bool {
        if let Some(cache_path) = cache_file_path() {
            if cache_path.exists() {
                if let Ok(data) = std::fs::read(&cache_path) {
                    let result: Result<Vec<IndexedFile>, _> = bincode::deserialize(&data);
                    if let Ok(files) = result {
                        let count = files.len();
                        {
                            let mut f = self.files.write();
                            *f = files;
                        }
                        {
                            let mut p = self.progress.write();
                            p.done = true;
                            p.indexed = count;
                            p.total = count;
                            p.total_files = count;
                        }
                        println!("Loaded {} files from cache", count);
                        return true;
                    }
                }
            }
        }
        false
    }

    pub fn save_cache(&self) -> bool {
        if let Some(cache_path) = cache_file_path() {
            let files = self.files.read();
            if let Ok(data) = bincode::serialize(&*files) {
                if std::fs::write(&cache_path, data).is_ok() {
                    println!("Saved {} files to cache", files.len());
                    return true;
                }
            }
        }
        false
    }

    pub fn add_index_path(self: &Arc<Self>, path: String) {
        let mut paths = self.index_paths.write();
        if !paths.contains(&path) {
            paths.push(path);
        }
    }

    pub fn remove_index_path(self: &Arc<Self>, path: &str) {
        let mut paths = self.index_paths.write();
        paths.retain(|p| p != path);
    }

    pub fn get_index_paths(&self) -> Vec<String> {
        self.index_paths.read().clone()
    }

    pub fn get_progress(&self) -> IndexProgress {
        let progress = self.progress.read().clone();
        let files = self.files.read();
        IndexProgress {
            total_files: files.len(),
            ..progress
        }
    }

    pub fn start_indexing(self: &Arc<Self>) {
        let self_arc = Arc::clone(self);
        let paths = self.index_paths.read().clone();

        if paths.is_empty() {
            return;
        }

        {
            let mut indexing = self_arc.is_indexing.write();
            if *indexing {
                return;
            }
            *indexing = true;
        }

        {
            let mut progress = self_arc.progress.write();
            progress.done = false;
            progress.indexed = 0;
            progress.total = 0;
            progress.current_path = String::new();
        }

        thread::spawn(move || {
            let start = Instant::now();
            self_arc.do_indexing(paths);
            let elapsed = start.elapsed();
            println!("Indexing completed in {:?}", elapsed);
            self_arc.save_cache();
            let mut indexing = self_arc.is_indexing.write();
            *indexing = false;
        });
    }

    fn do_indexing(&self, paths: Vec<String>) {
        let mut all_dirs: Vec<(PathBuf, bool)> = Vec::new();

        for base_path in &paths {
            let base = PathBuf::from(base_path);
            if !base.exists() {
                continue;
            }
            all_dirs.push((base, false));
        }

        while let Some((dir, _)) = all_dirs.pop() {
            let walker = WalkDir::new(&dir)
                .min_depth(1)
                .max_depth(1)
                .follow_links(false)
                .into_iter()
                .filter_entry(|e| {
                    let name = e.file_name().to_string_lossy();
                    !(name.starts_with('.')
                        || name == "node_modules"
                        || name == "target"
                        || name == "dist"
                        || name == "build")
                });

            for entry in walker.flatten() {
                let path = entry.path().to_path_buf();
                if entry.file_type().is_dir() {
                    all_dirs.push((path, false));
                }
            }
        }

        let mut new_files: Vec<IndexedFile> = Vec::new();
        let mut indexed = 0usize;
        let mut seen = HashSet::new();

        for base_path in &paths {
            let base = PathBuf::from(base_path);
            if !base.exists() {
                continue;
            }

            let walker = WalkDir::new(&base)
                .follow_links(false)
                .into_iter()
                .filter_entry(|e| {
                    let name = e.file_name().to_string_lossy();
                    !(name.starts_with('.')
                        || name == "node_modules"
                        || name == "target"
                        || name == "dist"
                        || name == "build")
                });

            for entry in walker.flatten() {
                let path = entry.path().to_path_buf();
                let path_str = path.to_string_lossy().to_string();

                if !seen.insert(path_str.clone()) {
                    continue;
                }

                let name = entry.file_name().to_string_lossy().to_string();
                let name_lower = name.to_lowercase();
                let is_dir = entry.file_type().is_dir();

                let extension = path
                    .extension()
                    .and_then(|e| e.to_str())
                    .unwrap_or("")
                    .to_lowercase();

                let path_lower = path_str.to_lowercase();

                let (size, modified) = entry
                    .metadata()
                    .map(|m| {
                        let size = m.len();
                        let modified = m
                            .modified()
                            .ok()
                            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                            .map(|d| d.as_secs() as i64)
                            .unwrap_or(0);
                        (size, modified)
                    })
                    .unwrap_or((0, 0));

                new_files.push(IndexedFile {
                    path,
                    path_lower,
                    name,
                    name_lower,
                    is_dir,
                    size,
                    modified,
                    extension,
                });

                indexed += 1;
                if indexed % 500 == 0 {
                    let mut progress = self.progress.write();
                    progress.indexed = indexed;
                    progress.current_path = path_str;
                }
            }
        }

        {
            let mut files = self.files.write();
            *files = new_files;
        }

        {
            let mut progress = self.progress.write();
            progress.indexed = indexed;
            progress.total = indexed;
            progress.done = true;
            progress.current_path = String::new();
        }
    }

    pub fn search(&self, options: SearchOptions) -> Vec<FileItem> {
        let query = options.query.trim();
        let has_filter = !query.is_empty()
            || !options.path_filter.is_empty()
            || !options.extensions.is_empty()
            || options.file_type != "all";
        if !has_filter {
            return Vec::new();
        }

        let files = self.files.read();
        let query_lower = query.to_lowercase();
        let path_filter_lower = options.path_filter.to_lowercase();

        let regex = if options.use_regex && !query.is_empty() {
            Regex::new(&if options.case_sensitive {
                query.to_string()
            } else {
                format!("(?i){}", query)
            })
            .ok()
        } else {
            None
        };

        let wildcard_regex = if !options.use_regex
            && !query.is_empty()
            && (query.contains('*') || query.contains('?'))
        {
            let pattern = query
                .chars()
                .map(|c| match c {
                    '*' => ".*".to_string(),
                    '?' => ".".to_string(),
                    '.' => "\\.".to_string(),
                    '+' => "\\+".to_string(),
                    '(' => "\\(".to_string(),
                    ')' => "\\)".to_string(),
                    '[' => "\\[".to_string(),
                    ']' => "\\]".to_string(),
                    '{' => "\\{".to_string(),
                    '}' => "\\}".to_string(),
                    '\\' => "\\\\".to_string(),
                    '^' => "\\^".to_string(),
                    '$' => "\\$".to_string(),
                    '|' => "\\|".to_string(),
                    c => c.to_string(),
                })
                .collect::<String>();
            Regex::new(&format!("(?i)^{}$", pattern)).ok()
        } else {
            None
        };

        let ext_set: HashSet<String> = options
            .extensions
            .iter()
            .map(|e| e.to_lowercase())
            .collect();

        let results: Vec<(FileItem, i64)> = files
            .par_iter()
            .filter_map(|f| {
                if options.file_type == "file" && f.is_dir {
                    return None;
                }
                if options.file_type == "dir" && !f.is_dir {
                    return None;
                }

                if !ext_set.is_empty() && !f.is_dir {
                    if !ext_set.contains(&f.extension) {
                        return None;
                    }
                }

                if options.min_size > 0 && f.size < options.min_size {
                    return None;
                }
                if options.max_size > 0 && f.size > options.max_size {
                    return None;
                }
                if options.min_date > 0 && f.modified < options.min_date {
                    return None;
                }
                if options.max_date > 0 && f.modified > options.max_date {
                    return None;
                }

                if !path_filter_lower.is_empty() {
                    if !f.path_lower.contains(&path_filter_lower) {
                        return None;
                    }
                }

                let search_name = if options.case_sensitive {
                    &f.name
                } else {
                    &f.name_lower
                };
                let search_path = if options.case_sensitive {
                    f.path.to_str().unwrap_or("")
                } else {
                    &f.path_lower
                };
                let search_query = if options.case_sensitive {
                    query
                } else {
                    &query_lower
                };

                let score = if query.is_empty() {
                    Some(100i64)
                } else if let Some(re) = &regex {
                    if re.is_match(search_name) || (options.match_path && re.is_match(search_path)) {
                        Some(800i64)
                    } else {
                        None
                    }
                } else if let Some(wild_re) = &wildcard_regex {
                    if wild_re.is_match(search_name)
                        || (options.match_path && wild_re.is_match(search_path))
                    {
                        Some(700i64)
                    } else {
                        None
                    }
                } else if options.match_whole_word {
                    if search_name == search_query
                        || (options.match_path && f.path.ends_with(search_query))
                    {
                        Some(1000i64)
                    } else {
                        None
                    }
                } else if search_name.contains(search_query) {
                    let exact_bonus = if search_name == search_query { 200 } else { 0 };
                    let start_bonus = if search_name.starts_with(search_query) {
                        100
                    } else {
                        0
                    };
                    Some(500i64 + exact_bonus + start_bonus + (100 - search_name.len() as i64).max(0))
                } else if options.match_path && search_path.contains(search_query) {
                    Some(400i64)
                } else {
                    let name_score = self.matcher.fuzzy_match(search_name, search_query);
                    if name_score.is_some() {
                        name_score
                    } else if options.match_path {
                        self.matcher
                            .fuzzy_match(search_path, search_query)
                            .map(|s| s - 50)
                    } else {
                        None
                    }
                };

                score.map(|s| {
                    (
                        FileItem {
                            path: f.path.to_string_lossy().to_string(),
                            name: f.name.clone(),
                            is_dir: f.is_dir,
                            size: f.size,
                            modified: f.modified,
                        },
                        s,
                    )
                })
            })
            .collect();

        let mut sorted = results;
        let sort_by = options.sort_by.as_str();
        let desc = options.sort_desc;

        sorted.sort_by(|a, b| {
            let cmp = match sort_by {
                "name" => a.0.name.cmp(&b.0.name),
                "size" => a.0.size.cmp(&b.0.size),
                "date" | "modified" => a.0.modified.cmp(&b.0.modified),
                "path" => a.0.path.cmp(&b.0.path),
                "type" => {
                    let ext_a = a
                        .0
                        .path
                        .rsplit('.')
                        .next()
                        .unwrap_or("")
                        .to_lowercase();
                    let ext_b = b
                        .0
                        .path
                        .rsplit('.')
                        .next()
                        .unwrap_or("")
                        .to_lowercase();
                    ext_a.cmp(&ext_b).then(a.0.name.cmp(&b.0.name))
                }
                "relevance" => {
                    let score_cmp = b.1.cmp(&a.1);
                    if score_cmp != std::cmp::Ordering::Equal {
                        score_cmp
                    } else {
                        let a_is_dir = a.0.is_dir;
                        let b_is_dir = b.0.is_dir;
                        if a_is_dir && !b_is_dir {
                            std::cmp::Ordering::Less
                        } else if !a_is_dir && b_is_dir {
                            std::cmp::Ordering::Greater
                        } else {
                            a.0.name.len().cmp(&b.0.name.len())
                        }
                    }
                }
                _ => b.1.cmp(&a.1),
            };

            if desc && sort_by != "relevance" {
                cmp.reverse()
            } else {
                cmp
            }
        });

        sorted.into_iter().map(|(item, _)| item).take(500).collect()
    }
}
