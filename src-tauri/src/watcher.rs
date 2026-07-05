use crate::models::IndexedFile;
use notify::{RecommendedWatcher, RecursiveMode, Watcher};
use parking_lot::RwLock;
use std::collections::HashSet;
use std::path::{Path, PathBuf};
use std::sync::mpsc::channel;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

pub struct FileWatcher {
    watcher: Option<RecommendedWatcher>,
    watched_paths: RwLock<Vec<String>>,
    is_running: RwLock<bool>,
}

unsafe impl Send for FileWatcher {}
unsafe impl Sync for FileWatcher {}

impl FileWatcher {
    pub fn new() -> Arc<Self> {
        Arc::new(Self {
            watcher: None,
            watched_paths: RwLock::new(Vec::new()),
            is_running: RwLock::new(false),
        })
    }

    pub fn start<F>(self: &Arc<Self>, files: Arc<RwLock<Vec<IndexedFile>>>, on_change: F)
    where
        F: Fn() + Send + Sync + 'static,
    {
        let self_arc = Arc::clone(self);
        let paths = self.watched_paths.read().clone();

        if paths.is_empty() {
            return;
        }

        {
            let mut running = self_arc.is_running.write();
            if *running {
                return;
            }
            *running = true;
        }

        let (tx, rx) = channel();
        let mut watcher = notify::recommended_watcher(move |res| {
            let _ = tx.send(res);
        })
        .unwrap();

        for path in &paths {
            let p = Path::new(path);
            if p.exists() {
                let _ = watcher.watch(p, RecursiveMode::Recursive);
            }
        }

        self_arc.watcher = Some(watcher);

        let self_arc2 = Arc::clone(self_arc);
        let files_arc = Arc::clone(&files);

        thread::spawn(move || {
            let mut pending_changes = HashSet::new();
            let mut last_flush = std::time::Instant::now();
            let debounce = Duration::from_millis(500);

            loop {
                if !*self_arc2.is_running.read() {
                    break;
                }

                match rx.recv_timeout(Duration::from_millis(100)) {
                    Ok(Ok(event)) => {
                        for path in &event.paths {
                            pending_changes.insert(path.clone());
                        }
                    }
                    Ok(Err(_)) => continue,
                    Err(_) => {}
                }

                let now = std::time::Instant::now();
                if !pending_changes.is_empty() && now.duration_since(last_flush) > debounce {
                    Self::process_changes(&files_arc, &pending_changes);
                    pending_changes.clear();
                    last_flush = now;
                    on_change();
                }
            }
        });
    }

    fn process_changes(files: &RwLock<Vec<IndexedFile>>, changes: &HashSet<PathBuf>) {
        let mut current_files = files.write();

        for path in changes {
            let path_str = path.to_string_lossy().to_string();
            let path_lower = path_str.to_lowercase();

            if path.exists() {
                if let Ok(metadata) = std::fs::metadata(path) {
                    let is_dir = metadata.is_dir();
                    let name = path
                        .file_name()
                        .map(|n| n.to_string_lossy().to_string())
                        .unwrap_or_default();
                    let name_lower = name.to_lowercase();
                    let extension = path
                        .extension()
                        .and_then(|e| e.to_str())
                        .unwrap_or("")
                        .to_lowercase();
                    let size = metadata.len();
                    let modified = metadata
                        .modified()
                        .ok()
                        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
                        .map(|d| d.as_secs() as i64)
                        .unwrap_or(0);

                    if let Some(idx) = current_files.iter().position(|f| f.path == *path) {
                        current_files[idx] = IndexedFile {
                            path: path.clone(),
                            path_lower,
                            name,
                            name_lower,
                            is_dir,
                            size,
                            modified,
                            extension,
                        };
                    } else {
                        current_files.push(IndexedFile {
                            path: path.clone(),
                            path_lower,
                            name,
                            name_lower,
                            is_dir,
                            size,
                            modified,
                            extension,
                        });
                    }
                }
            } else {
                current_files.retain(|f| f.path != *path);
            }
        }
    }

    pub fn add_path(&self, path: &str) {
        let mut paths = self.watched_paths.write();
        if !paths.iter().any(|p| p == path) {
            paths.push(path.to_string());
        }
    }

    pub fn stop(&self) {
        let mut running = self.is_running.write();
        *running = false;
    }
}
