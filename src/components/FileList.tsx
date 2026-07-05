import React, { useState, useRef, useEffect } from "react";
import type { FileItem } from "../types";
import { formatSize, formatDate, openFileLocation, copyPath } from "../api";

interface FileListProps {
  files: FileItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpen: (file: FileItem) => void;
}

const FileList: React.FC<FileListProps> = ({ files, selectedIndex, onSelect, onOpen }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const selectedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedRef.current && listRef.current) {
      selectedRef.current.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, file });
  };

  const handleCopyPath = async (path: string) => {
    await copyPath(path);
    setContextMenu(null);
  };

  const handleOpenLocation = async (path: string) => {
    await openFileLocation(path);
    setContextMenu(null);
  };

  const handleDragStart = (e: React.DragEvent, file: FileItem) => {
    e.dataTransfer.effectAllowed = "copyMove";
    e.dataTransfer.setData("text/plain", file.path);
    e.dataTransfer.setData("text/uri-list", `file://${file.path}`);

    if ("startDrag" in e.dataTransfer) {
      return;
    }

    try {
      const dragImage = document.createElement("div");
      dragImage.textContent = file.name;
      dragImage.style.cssText =
        "position: absolute; top: -1000px; padding: 4px 8px; background: rgba(30,30,30,0.9); color: white; border-radius: 4px; font-size: 12px;";
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 10, 10);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    } catch {}
  };

  if (files.length === 0) {
    return (
      <div className="file-list">
        <div className="file-list-empty">
          <svg className="file-list-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="12" y1="18" x2="12" y2="12" />
            <line x1="9" y1="15" x2="15" y2="15" />
          </svg>
          <span>输入关键词开始搜索</span>
          <span className="file-list-empty-hint">快捷键: Cmd/Ctrl + Shift + F</span>
        </div>
      </div>
    );
  }

  return (
    <div className="file-list" ref={listRef}>
      {files.map((file, index) => (
        <div
          key={file.path}
          ref={index === selectedIndex ? selectedRef : null}
          className={`file-item ${index === selectedIndex ? "selected" : ""}`}
          draggable
          onDragStart={(e) => handleDragStart(e, file)}
          onClick={() => {
            onSelect(index);
          }}
          onDoubleClick={() => onOpen(file)}
          onContextMenu={(e) => handleContextMenu(e, file)}
        >
          <svg
            className={`file-icon ${file.is_dir ? "dir" : "file"}`}
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            {file.is_dir ? (
              <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
            ) : (
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
            )}
          </svg>
          <div className="file-info">
            <div className="file-name">{file.name}</div>
            <div className="file-path">{file.path}</div>
          </div>
          <div className="file-meta">
            <span className="file-size">{file.is_dir ? "" : formatSize(file.size)}</span>
            <span className="file-date">{formatDate(file.modified)}</span>
          </div>
        </div>
      ))}
      {contextMenu && (
        <div
          className="context-menu"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <div className="context-menu-item" onClick={() => onOpen(contextMenu.file)}>
            <svg className="context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 19H5V5h7V3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z" />
            </svg>
            打开
          </div>
          <div
            className="context-menu-item"
            onClick={() => handleOpenLocation(contextMenu.file.path)}
          >
            <svg className="context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
            </svg>
            打开所在文件夹
          </div>
          <div
            className="context-menu-item"
            onClick={() => handleCopyPath(contextMenu.file.path)}
          >
            <svg className="context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
            复制路径
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
