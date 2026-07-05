import { invoke } from "@tauri-apps/api/core";
import type { FileItem, SearchOptions, IndexProgress } from "./types";

export async function startIndexing(paths: string[]): Promise<void> {
  return invoke("start_indexing", { paths });
}

export async function searchFiles(
  options: SearchOptions
): Promise<FileItem[]> {
  return invoke("search_files", { options });
}

export async function getIndexStatus(): Promise<IndexProgress> {
  return invoke("get_index_status");
}

export async function openFile(path: string): Promise<void> {
  return invoke("open_file", { path });
}

export async function openFileLocation(path: string): Promise<void> {
  return invoke("open_file_location", { path });
}

export async function copyPath(path: string): Promise<void> {
  return invoke("copy_path", { path });
}

export async function hideWindow(): Promise<void> {
  return invoke("hide_window");
}

export async function showWindow(): Promise<void> {
  return invoke("show_window");
}

export async function getRootDirs(): Promise<string[]> {
  return invoke("get_root_dirs");
}

export async function addIndexPath(path: string): Promise<void> {
  return invoke("add_index_path", { path });
}

export async function removeIndexPath(path: string): Promise<void> {
  return invoke("remove_index_path", { path });
}

export async function getIndexPaths(): Promise<string[]> {
  return invoke("get_index_paths");
}

export async function rebuildIndex(): Promise<void> {
  return invoke("rebuild_index");
}

export function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

export function formatDate(timestamp: number): string {
  const date = new Date(timestamp * 1000);
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const SEARCH_HISTORY_KEY = "finder_search_history";
const MAX_HISTORY = 50;

export function getSearchHistory(): string[] {
  try {
    const data = localStorage.getItem(SEARCH_HISTORY_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addSearchHistory(query: string): void {
  if (!query.trim()) return;
  try {
    const history = getSearchHistory();
    const filtered = history.filter((q) => q !== query);
    filtered.unshift(query);
    const trimmed = filtered.slice(0, MAX_HISTORY);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch {}
}

export function removeSearchHistoryItem(query: string): void {
  try {
    const history = getSearchHistory();
    const filtered = history.filter((q) => q !== query);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(filtered));
  } catch {}
}

export async function readFileText(path: string, maxBytes: number = 10240): Promise<string> {
  return invoke("read_file_text", { path, maxBytes });
}
