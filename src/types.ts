export interface FileItem {
  path: string;
  name: string;
  is_dir: boolean;
  size: number;
  modified: number;
}

export interface SearchOptions {
  query: string;
  case_sensitive?: boolean;
  match_whole_word?: boolean;
  file_type?: "all" | "file" | "dir";
  extensions?: string[];
  sort_by?: string;
  sort_desc?: boolean;
  path_filter?: string;
  use_regex?: boolean;
  match_path?: boolean;
  min_size?: number;
  max_size?: number;
  min_date?: number;
  max_date?: number;
}

export interface IndexProgress {
  indexed: number;
  total: number;
  current_path: string;
  done: boolean;
  total_files: number;
}

export type FileCategory =
  | "all"
  | "audio"
  | "compressed"
  | "document"
  | "executable"
  | "folder"
  | "image"
  | "video";

export const CATEGORY_EXTENSIONS: Record<Exclude<FileCategory, "all" | "folder">, string[]> = {
  audio: ["mp3", "wav", "flac", "aac", "ogg", "wma", "m4a", "aiff", "opus"],
  compressed: ["zip", "rar", "7z", "tar", "gz", "bz2", "xz", "iso", "dmg"],
  document: [
    "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
    "txt", "md", "rtf", "odt", "ods", "odp", "csv",
    "epub", "mobi",
  ],
  executable: ["exe", "msi", "app", "dmg", "pkg", "deb", "rpm", "apk", "bat", "sh"],
  image: ["jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "tiff", "ico", "heic", "raw"],
  video: ["mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v", "mpeg", "mpg"],
};
