mod index;
mod models;

use index::FileIndex;
use models::*;
use std::sync::Arc;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem},
    tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent},
    AppHandle, Manager, Runtime, State, WindowEvent,
};
use tauri_plugin_global_shortcut::{Code, GlobalShortcutExt, ShortcutState};

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
fn open_file(path: String) -> Result<(), String> {
    opener::open(&path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn open_file_location(path: String) -> Result<(), String> {
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
        use std::process::Command;
        Command::new("open")
            .args(["-R", &path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let parent = std::path::Path::new(&path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_else(|| "/".to_string());
        opener::open(&parent).map_err(|e| e.to_string())?;
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
        Ok(vec![
            "/".to_string(),
            std::env::var("HOME").unwrap_or_else(|_| "~".to_string()),
        ])
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

#[tauri::command]
fn copy_path(path: String, app: AppHandle) -> Result<(), String> {
    use tauri_plugin_clipboard::ClipboardExt;
    app.clipboard().write_text(&path).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn hide_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.hide().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
fn show_window(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

fn setup_tray<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let show_item = MenuItem::with_id(app, "show", "显示窗口", true, None::<&str>)?;
    let hide_item = MenuItem::with_id(app, "hide", "隐藏窗口", true, None::<&str>)?;
    let quit_item = MenuItem::with_id(app, "quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(app, &[&show_item, &hide_item, &quit_item])?;

    let _tray = TrayIconBuilder::new()
        .icon(Image::from_bytes(include_bytes!("../icons/icon.png")))
        .menu(&menu)
        .menu_on_event(|app, event| {
            match event.id.as_ref() {
                "show" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.show();
                        let _ = window.set_focus();
                    }
                }
                "hide" => {
                    if let Some(window) = app.get_webview_window("main") {
                        let _ = window.hide();
                    }
                }
                "quit" => {
                    app.exit(0);
                }
                _ => {}
            }
        })
        .on_tray_icon_event(|tray, event| {
            if event.event == TrayIconEvent::Click {
                if event.button == MouseButton::Left
                    && event.button_state == MouseButtonState::Up
                {
                    let app = tray.app_handle();
                    if let Some(window) = app.get_webview_window("main") {
                        if window.is_visible().unwrap_or(false) {
                            let _ = window.hide();
                        } else {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                }
            }
        })
        .build(app)?;

    Ok(())
}

fn setup_global_shortcut<R: Runtime>(app: &AppHandle<R>) -> Result<(), Box<dyn std::error::Error>> {
    let shortcut = app.global_shortcut();

    let app_handle = app.clone();
    shortcut.on_shortcut("CommandOrControl+Shift+F", |_app, _shortcut, event| {
        if event.state == ShortcutState::Pressed {
            if let Some(window) = app_handle.get_webview_window("main") {
                if window.is_visible().unwrap_or(false) {
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
        }
    })?;

    Ok(())
}

fn main() {
    let file_index = FileIndex::new();

    tauri::Builder::default()
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard::init())
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
            copy_path,
            hide_window,
            show_window,
        ])
        .setup(|app| {
            setup_tray(app.handle())?;
            setup_global_shortcut(app.handle())?;

            let state = app.state::<AppState>();
            let default_paths = get_root_dirs().unwrap_or_default();
            if !default_paths.is_empty() {
                for path in &default_paths {
                    state.file_index.add_index_path(path.clone());
                }
                state.file_index.start_indexing();
            }

            if let Some(window) = app.get_webview_window("main") {
                window.on_window_event(move |event| {
                    if let WindowEvent::CloseRequested { api, .. } = event {
                        api.prevent_close();
                        if let Some(window) = api.window().try_webview_window() {
                            let _ = window.hide();
                        }
                    }
                });
            }

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
