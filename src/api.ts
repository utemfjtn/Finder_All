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

const FAVORITES_KEY = "finder_favorites";
const MAX_FAVORITES = 100;

export interface FavoriteItem {
  path: string;
  name: string;
  is_dir: boolean;
  added_at: number;
}

export function getFavorites(): FavoriteItem[] {
  try {
    const data = localStorage.getItem(FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addFavorite(file: { path: string; name: string; is_dir: boolean }): void {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter((f) => f.path !== file.path);
    filtered.unshift({ ...file, added_at: Date.now() });
    const trimmed = filtered.slice(0, MAX_FAVORITES);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function removeFavorite(path: string): void {
  try {
    const favorites = getFavorites();
    const filtered = favorites.filter((f) => f.path !== path);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(filtered));
  } catch {}
}

export function isFavorite(path: string): boolean {
  const favorites = getFavorites();
  return favorites.some((f) => f.path === path);
}

const RECENT_KEY = "finder_recent_files";
const MAX_RECENT = 50;

export interface RecentItem {
  path: string;
  name: string;
  is_dir: boolean;
  opened_at: number;
}

export function getRecentFiles(): RecentItem[] {
  try {
    const data = localStorage.getItem(RECENT_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function addRecentFile(file: { path: string; name: string; is_dir: boolean }): void {
  try {
    const recent = getRecentFiles();
    const filtered = recent.filter((f) => f.path !== file.path);
    filtered.unshift({ ...file, opened_at: Date.now() });
    const trimmed = filtered.slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(trimmed));
  } catch {}
}

export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(RECENT_KEY);
  } catch {}
}

export function removeRecentFile(path: string): void {
  try {
    const recent = getRecentFiles();
    const filtered = recent.filter((f) => f.path !== path);
    localStorage.setItem(RECENT_KEY, JSON.stringify(filtered));
  } catch {}
}
