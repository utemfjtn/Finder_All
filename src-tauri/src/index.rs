use crate::models::*;
use fuzzy_matcher::skim::SkimMatcherV2;
use fuzzy_matcher::FuzzyMatcher;
use parking_lot::RwLock;
use rayon::prelude::*;
use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use walkdir::WalkDir;

pub struct FileIndex {
    files: RwLock<Vec<IndexedFile>>,
    index_paths: RwLock<Vec<String>>,
    progress: RwLock<IndexProgress>,
    is_indexing: RwLock<bool>,
    matcher: SkimMatcherV2,
}

impl FileIndex {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            files: RwLock::new(Vec::new()),
            index_paths: RwLock::new(Vec::new()),
            progress: RwLock::new(IndexProgress::default()),
            is_indexing: RwLock::new(false),
            matcher: SkimMatcherV2::default().ignore_case(),
        })
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
        self.progress.read().clone()
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
            self_arc.do_indexing(paths);
            let mut indexing = self_arc.is_indexing.write();
            *indexing = false;
        });
    }

    fn do_indexing(&self, paths: Vec<String>) {
        let mut new_files: Vec<IndexedFile> = Vec::new();
        let mut indexed = 0usize;

        {
            let mut progress = self.progress.write();
            progress.done = false;
            progress.indexed = 0;
            progress.total = 0;
            progress.current_path = String::new();
        }

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

                let name = entry
                    .file_name()
                    .to_string_lossy()
                    .to_string();
                let name_lower = name.to_lowercase();
                let is_dir = entry.file_type().is_dir();

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
                    name,
                    name_lower,
                    is_dir,
                    size,
                    modified,
                });

                indexed += 1;
                if indexed % 100 == 0 {
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
        if query.is_empty() {
            return Vec::new();
        }

        let files = self.files.read();
        let query_lower = query.to_lowercase();

        let results: Vec<FileItem> = files
            .par_iter()
            .filter_map(|f| {
                if options.file_type == "file" && f.is_dir {
                    return None;
                }
                if options.file_type == "dir" && !f.is_dir {
                    return None;
                }

                if !options.extensions.is_empty() && !f.is_dir {
                    let ext = f
                        .path
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                    if !options.extensions.iter().any(|e| e.to_lowercase() == ext) {
                        return None;
                    }
                }

                let search_name = if options.case_sensitive {
                    &f.name
                } else {
                    &f.name_lower
                };
                let search_query = if options.case_sensitive {
                    query
                } else {
                    &query_lower
                };

                let score = if options.match_whole_word {
                    if search_name == search_query {
                        Some(1000i64)
                    } else {
                        None
                    }
                } else if search_name.contains(search_query) {
                    Some(500i64 + (100 - search_name.len() as i64).max(0))
                } else {
                    self.matcher.fuzzy_match(search_name, search_query)
                };

                score.map(|s| (f, s))
            })
            .map(|(f, _score)| FileItem {
                path: f.path.to_string_lossy().to_string(),
                name: f.name.clone(),
                is_dir: f.is_dir,
                size: f.size,
                modified: f.modified,
            })
            .collect();

        let mut sorted = results;
        sorted.sort_by(|a, b| {
            let a_contains = a.name.to_lowercase().contains(&query_lower);
            let b_contains = b.name.to_lowercase().contains(&query_lower);
            if a_contains && !b_contains {
                std::cmp::Ordering::Less
            } else if !a_contains && b_contains {
                std::cmp::Ordering::Greater
            } else {
                let a_is_dir = a.is_dir;
                let b_is_dir = b.is_dir;
                if a_is_dir && !b_is_dir {
                    std::cmp::Ordering::Less
                } else if !a_is_dir && b_is_dir {
                    std::cmp::Ordering::Greater
                } else {
                    a.name.len().cmp(&b.name.len())
                }
            }
        });

        sorted.truncate(500);
        sorted
    }
}
