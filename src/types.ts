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
}

export interface IndexProgress {
  indexed: number;
  total: number;
  current_path: string;
  done: boolean;
}
