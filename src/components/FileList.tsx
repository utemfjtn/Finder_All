import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import type { FileItem } from "../types";
import { formatSize, formatDate, openFileLocation, copyPath, addFavorite, removeFavorite } from "../api";

interface FileListProps {
  files: FileItem[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  onOpen: (file: FileItem) => void;
  onFavoritesChange?: () => void;
}

const ITEM_HEIGHT = 52;
const BUFFER_ITEMS = 10;
const VIRTUAL_THRESHOLD = 200;

const FileList: React.FC<FileListProps> = ({ files, selectedIndex, onSelect, onOpen, onFavoritesChange }) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FileItem } | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [favoritesCache, setFavoritesCache] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const data = localStorage.getItem("finder_favorites");
      if (data) {
        const list = JSON.parse(data) as { path: string }[];
        setFavoritesCache(new Set(list.map((f) => f.path)));
      } else {
        setFavoritesCache(new Set());
      }
    } catch {
      setFavoritesCache(new Set());
    }
  }, [files]);

  const toggleFavorite = (file: FileItem) => {
    const currentIsFav = favoritesCache.has(file.path);
    if (currentIsFav) {
      removeFavorite(file.path);
      setFavoritesCache((prev) => {
        const next = new Set(prev);
        next.delete(file.path);
        return next;
      });
    } else {
      addFavorite(file);
      setFavoritesCache((prev) => {
        const next = new Set(prev);
        next.add(file.path);
        return next;
      });
    }
    onFavoritesChange?.();
  };

  useEffect(() => {
    const updateHeight = () => {
      if (listRef.current) {
        setContainerHeight(listRef.current.clientHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  const { startIndex, endIndex, offsetY } = useMemo(() => {
    if (files.length <= VIRTUAL_THRESHOLD) {
      return { startIndex: 0, endIndex: files.length, offsetY: 0 };
    }
    const start = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_ITEMS);
    const visibleCount = Math.ceil(containerHeight / ITEM_HEIGHT) + BUFFER_ITEMS * 2;
    const end = Math.min(files.length, start + visibleCount);
    return {
      startIndex: start,
      endIndex: end,
      offsetY: start * ITEM_HEIGHT,
    };
  }, [scrollTop, containerHeight, files.length]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  useEffect(() => {
    if (listRef.current && files.length > 0) {
      const selectedTop = selectedIndex * ITEM_HEIGHT;
      const selectedBottom = selectedTop + ITEM_HEIGHT;
      const viewTop = scrollTop;
      const viewBottom = scrollTop + containerHeight;

      if (selectedTop < viewTop || selectedBottom > viewBottom) {
        listRef.current.scrollTop = selectedTop - containerHeight / 2 + ITEM_HEIGHT / 2;
      }
    }
  }, [selectedIndex, files.length, containerHeight, scrollTop]);

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

  const renderFileItem = (file: FileItem, index: number) => (
    <div
      key={file.path}
      className={`file-item ${index === selectedIndex ? "selected" : ""}`}
      style={{ height: ITEM_HEIGHT }}
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
      <div
        className={`file-item-favorite ${favoritesCache.has(file.path) ? "active" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite(file);
        }}
        title={favoritesCache.has(file.path) ? "取消收藏" : "添加收藏"}
      >
        {favoritesCache.has(file.path) ? "★" : "☆"}
      </div>
    </div>
  );

  if (files.length === 0) {
    return (
      <div className="file-list" ref={listRef}>
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

  const useVirtual = files.length > VIRTUAL_THRESHOLD;
  const visibleFiles = useVirtual ? files.slice(startIndex, endIndex) : files;
  const totalHeight = useVirtual ? files.length * ITEM_HEIGHT : undefined;

  return (
    <div
      className="file-list"
      ref={listRef}
      onScroll={handleScroll}
      style={{ overflowY: "auto" }}
    >
      {useVirtual && (
        <div style={{ height: totalHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleFiles.map((file, i) => renderFileItem(file, startIndex + i))}
          </div>
        </div>
      )}
      {!useVirtual && files.map((file, index) => renderFileItem(file, index))}
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
          <div
            className="context-menu-item"
            onClick={() => {
              toggleFavorite(contextMenu.file);
              setContextMenu(null);
            }}
          >
            <svg className="context-menu-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {favoritesCache.has(contextMenu.file.path) ? "取消收藏" : "添加收藏"}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileList;
