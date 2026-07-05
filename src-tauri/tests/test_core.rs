use std::fs;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::time::Duration;

mod models {
    include!("src/models.rs");
}
mod index {
    include!("src/index.rs");
}

use index::FileIndex;
use models::{SearchOptions, SortBy};

fn create_test_dirs(base: &str) -> Vec<PathBuf> {
    let base = PathBuf::from(base);
    fs::create_dir_all(&base).unwrap();

    let files = vec![
        "documents/report_2024.pdf",
        "documents/report_2025.docx",
        "documents/meeting_notes.txt",
        "pictures/vacation_photo.jpg",
        "pictures/screenshot.png",
        "projects/hello_world/src/main.rs",
        "projects/hello_world/Cargo.toml",
        "projects/website/index.html",
        "projects/website/style.css",
        "downloads/installer.exe",
        "music/song.mp3",
        ".git/config",
    ];

    let mut paths = Vec::new();
    for f in &files {
        let p = base.join(f);
        if let Some(parent) = p.parent() {
            fs::create_dir_all(parent).unwrap();
        }
        fs::write(&p, "test content").unwrap();
        paths.push(p);
    }
    paths
}

#[test]
fn test_index_and_search() {
    let tmp_dir = format!("/tmp/finder_all_test_{}", std::process::id());
    let _ = create_test_dirs(&tmp_dir);

    let index = FileIndex::new();
    index.add_index_path(tmp_dir.clone());
    index.start_indexing();

    let mut waited = 0;
    loop {
        let progress = index.get_progress();
        if progress.status == "completed" || waited > 30 {
            break;
        }
        thread::sleep(Duration::from_millis(500));
        waited += 1;
    }

    let progress = index.get_progress();
    println!("Index status: {:?}, total files: {}", progress.status, progress.total_files);
    assert!(progress.total_files >= 12);

    let results = index.search(SearchOptions {
        query: "report".to_string(),
        sort_by: SortBy::default(),
        show_directories: false,
        show_files: true,
        limit: 10,
    });
    println!("Search 'report' found: {} results", results.len());
    for r in &results {
        println!("  - {:?}", r.name);
    }
    assert!(results.len() >= 2);

    let results = index.search(SearchOptions {
        query: "main.rs".to_string(),
        sort_by: SortBy::default(),
        show_directories: false,
        show_files: true,
        limit: 10,
    });
    println!("Search 'main.rs' found: {} results", results.len());
    assert_eq!(results.len(), 1);
    assert!(results[0].name.contains("main.rs"));

    let results = index.search(SearchOptions {
        query: "hw".to_string(),
        sort_by: SortBy::default(),
        show_directories: false,
        show_files: true,
        limit: 10,
    });
    println!("Fuzzy search 'hw' found: {} results", results.len());
    assert!(results.len() >= 1);

    let results = index.search(SearchOptions {
        query: "nonexistent_file_xyz".to_string(),
        sort_by: SortBy::default(),
        show_directories: false,
        show_files: true,
        limit: 10,
    });
    println!("Search nonexistent found: {} results", results.len());
    assert_eq!(results.len(), 0);

    fs::remove_dir_all(&tmp_dir).unwrap_or_default();
    println!("All tests passed!");
}

fn main() {
    test_index_and_search();
}
