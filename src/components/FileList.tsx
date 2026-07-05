import React, { useState, useRef, useEffect } from "react";
import type { FileItem } from "../types";
import { formatSize, formatDate, openFileLocation } from "../api";

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
            打开
          </div>
          <div
            className="context-menu-item"
            onClick={() => openFileLocation(contextMenu.file.path)}
          >
            打开所在位置
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
