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
    #[serde(default = "default_sort_by")]
    pub sort_by: String,
    #[serde(default)]
    pub sort_desc: bool,
    #[serde(default)]
    pub path_filter: String,
    #[serde(default)]
    pub use_regex: bool,
    #[serde(default)]
    pub match_path: bool,
    #[serde(default)]
    pub min_size: u64,
    #[serde(default)]
    pub max_size: u64,
    #[serde(default)]
    pub min_date: i64,
    #[serde(default)]
    pub max_date: i64,
}

fn default_file_type() -> String {
    "all".to_string()
}

fn default_sort_by() -> String {
    "relevance".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexProgress {
    pub indexed: usize,
    pub total: usize,
    pub current_path: String,
    pub done: bool,
    pub total_files: usize,
}

impl Default for IndexProgress {
    fn default() -> Self {
        Self {
            indexed: 0,
            total: 0,
            current_path: String::new(),
            done: true,
            total_files: 0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IndexedFile {
    pub path: PathBuf,
    pub path_lower: String,
    pub name: String,
    pub name_lower: String,
    pub is_dir: bool,
    pub size: u64,
    pub modified: i64,
    pub extension: String,
}
