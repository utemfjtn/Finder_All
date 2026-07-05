mod index;
mod models;

use index::FileIndex;
use models::*;
use std::sync::Arc;
use tauri::State;
use tauri_plugin_shell::ShellExt;

struct AppState {
    file_index: Arc<FileIndex>,
}

#[tauri::command]
fn start_indexing(state: State<AppState>, paths: Vec<String>) -> Result<(), String> {
    for path in &paths {
        state.file_index.add_index_path(path.clone());
    }
    state.file_index.start_indexing();
    Ok(())
}

#[tauri::command]
fn search_files(state: State<AppState>, options: SearchOptions) -> Result<Vec<FileItem>, String> {
    Ok(state.file_index.search(options))
}

#[tauri::command]
fn get_index_status(state: State<AppState>) -> Result<IndexProgress, String> {
    Ok(state.file_index.get_progress())
}

#[tauri::command]
fn open_file(app: tauri::AppHandle, path: String) -> Result<(), String> {
    app.shell()
        .open(&path, None)
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_file_location(app: tauri::AppHandle, path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("explorer")
            .args(["/select,", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "macos")]
    {
        app.shell()
            .open("reveal", Some(&path))
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let parent = std::path::Path::new(&path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| "/".to_string());
        app.shell()
            .open(&parent, None)
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn get_root_dirs() -> Result<Vec<String>, String> {
    #[cfg(target_os = "windows")]
    {
        let mut drives = Vec::new();
        for drive in b'A'..=b'Z' {
            let drive_path = format!("{}:\\", drive as char);
            if std::path::Path::new(&drive_path).exists() {
                drives.push(drive_path);
            }
        }
        Ok(drives)
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(vec!["/".to_string(), std::env::var("HOME").unwrap_or_else(|_| "~".to_string())])
    }
}

#[tauri::command]
fn add_index_path(state: State<AppState>, path: String) -> Result<(), String> {
    state.file_index.add_index_path(path);
    state.file_index.start_indexing();
    Ok(())
}

#[tauri::command]
fn remove_index_path(state: State<AppState>, path: String) -> Result<(), String> {
    state.file_index.remove_index_path(&path);
    Ok(())
}

#[tauri::command]
fn get_index_paths(state: State<AppState>) -> Result<Vec<String>, String> {
    Ok(state.file_index.get_index_paths())
}

#[tauri::command]
fn rebuild_index(state: State<AppState>) -> Result<(), String> {
    state.file_index.start_indexing();
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let file_index = FileIndex::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(AppState {
            file_index: Arc::clone(&file_index),
        })
        .invoke_handler(tauri::generate_handler![
            start_indexing,
            search_files,
            get_index_status,
            open_file,
            open_file_location,
            get_root_dirs,
            add_index_path,
            remove_index_path,
            get_index_paths,
            rebuild_index,
        ])
        .setup(|app| {
            let state = app.state::<AppState>();
            let default_paths = get_root_dirs().unwrap_or_default();
            if !default_paths.is_empty() {
                for path in &default_paths {
                    state.file_index.add_index_path(path.clone());
                }
                state.file_index.start_indexing();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
