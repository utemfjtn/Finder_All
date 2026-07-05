import React, { useState, useEffect } from "react";
import type { FileItem } from "../types";
import { formatSize, formatDate, readFileText, openFile, openFileLocation } from "../api";

interface FilePreviewProps {
  file: FileItem | null;
  onClose: () => void;
}

const TEXT_EXTENSIONS = [
  "txt", "md", "json", "xml", "html", "css", "js", "ts", "tsx", "jsx",
  "py", "rs", "go", "java", "c", "cpp", "h", "hpp", "rb", "php",
  "sh", "bash", "zsh", "fish", "yaml", "yml", "toml", "ini", "cfg",
  "csv", "log", "gitignore", "env", "conf", "vue", "svelte",
];

const IMAGE_EXTENSIONS = [
  "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico",
];

const FilePreview: React.FC<FilePreviewProps> = ({ file, onClose }) => {
  const [previewContent, setPreviewContent] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    if (!file || file.is_dir) {
      setPreviewContent("");
      setError("");
      return;
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "";

    if (TEXT_EXTENSIONS.includes(ext)) {
      setLoading(true);
      setError("");
      readFileText(file.path, 20480)
        .then((text) => {
          setPreviewContent(text);
        })
        .catch((e) => {
          setError(String(e));
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPreviewContent("");
      setError("");
    }
  }, [file]);

  if (!file) return null;

  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  const isText = TEXT_EXTENSIONS.includes(ext);
  const isImage = IMAGE_EXTENSIONS.includes(ext);

  return (
    <div className="file-preview-overlay" onClick={onClose}>
      <div
        className="file-preview-panel"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="file-preview-header">
          <div className="file-preview-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
              {file.is_dir ? (
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              ) : (
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              )}
            </svg>
            <span className="preview-name" title={file.name}>{file.name}</span>
          </div>
          <button className="preview-close" onClick={onClose} title="关闭 (Space)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="file-preview-body">
          {loading && (
            <div className="preview-loading">
              <div className="preview-spinner" />
              <span>加载中...</span>
            </div>
          )}

          {!loading && error && (
            <div className="preview-error">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>无法预览: {error}</span>
            </div>
          )}

          {!loading && !error && file.is_dir && (
            <div className="preview-info">
              <div className="preview-info-row">
                <span className="info-label">类型</span>
                <span className="info-value">文件夹</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">路径</span>
                <span className="info-value path">{file.path}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">修改时间</span>
                <span className="info-value">{formatDate(file.modified)}</span>
              </div>
            </div>
          )}

          {!loading && !error && !file.is_dir && !isText && !isImage && (
            <div className="preview-info">
              <div className="preview-info-row">
                <span className="info-label">类型</span>
                <span className="info-value">{ext.toUpperCase()} 文件</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">大小</span>
                <span className="info-value">{formatSize(file.size)}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">路径</span>
                <span className="info-value path">{file.path}</span>
              </div>
              <div className="preview-info-row">
                <span className="info-label">修改时间</span>
                <span className="info-value">{formatDate(file.modified)}</span>
              </div>
              <div className="preview-hint">
                按 Enter 打开文件
              </div>
            </div>
          )}

          {!loading && !error && isText && (
            <div className="preview-text">
              <pre>{previewContent}</pre>
              {previewContent.length >= 20000 && (
                <div className="preview-text-truncated">
                  仅显示前 20KB 内容
                </div>
              )}
            </div>
          )}

          {!loading && !error && isImage && (
            <div className="preview-image">
              <img src={`file://${file.path}`} alt={file.name} />
            </div>
          )}
        </div>

        <div className="file-preview-footer">
          <button className="preview-btn primary" onClick={() => openFile(file.path)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
            打开文件
          </button>
          <button className="preview-btn" onClick={() => openFileLocation(file.path)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
            </svg>
            所在文件夹
          </button>
          <div className="preview-shortcut-hint">Space 关闭</div>
        </div>
      </div>
    </div>
  );
};

export default FilePreview;
