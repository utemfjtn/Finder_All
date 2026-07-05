use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FileItem {
    pub path: String,
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SearchOptions {
    pub query: String,
    #[serde(default)]
    pub case_sensitive: bool,
    #[serde(default)]
    pub match_whole_word: bool,
    #[serde(default = "default_file_type")]
    pub file_type: String,
    #[serde(default)]
    pub extensions: Vec<String>,
}

fn default_file_type() -> String {
    "all".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexProgress {
    pub indexed: usize,
    pub total: usize,
    pub current_path: String,
    pub done: bool,
}

impl Default for IndexProgress {
    fn default() -> Self {
        Self {
            indexed: 0,
            total: 0,
            current_path: String::new(),
            done: true,
        }
    }
}

#[derive(Debug, Clone)]
pub struct IndexedFile {
    pub path: PathBuf,
    pub name: String,
    pub name_lower: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: i64,
}
