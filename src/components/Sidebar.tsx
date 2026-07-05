import React, { useState, useEffect } from "react";
import {
  addIndexPath,
  removeIndexPath,
  getFavorites,
  removeFavorite,
  getRecentFiles,
  removeRecentFile,
  clearRecentFiles,
  openFile,
  type FavoriteItem,
  type RecentItem,
} from "../api";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  indexPaths: string[];
  onPathsChange: () => void;
  onRebuildIndex: () => void;
  onFavoriteClick?: (path: string) => void;
  onRecentClick?: (path: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  indexPaths,
  onPathsChange,
  onRebuildIndex,
  onFavoriteClick,
  onRecentClick,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPath, setNewPath] = useState("");
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [recentFiles, setRecentFiles] = useState<RecentItem[]>([]);

  useEffect(() => {
    setFavorites(getFavorites());
    setRecentFiles(getRecentFiles());
  }, []);

  const refreshFavorites = () => {
    setFavorites(getFavorites());
  };

  const refreshRecent = () => {
    setRecentFiles(getRecentFiles());
  };

  const handleAddPath = async () => {
    if (newPath.trim()) {
      try {
        await addIndexPath(newPath.trim());
        setNewPath("");
        setShowAddDialog(false);
        onPathsChange();
      } catch (e) {
        console.error("Failed to add path:", e);
      }
    }
  };

  const handleRemovePath = async (path: string) => {
    try {
      await removeIndexPath(path);
      onPathsChange();
    } catch (e) {
      console.error("Failed to remove path:", e);
    }
  };

  const handleRemoveFavorite = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeFavorite(path);
    refreshFavorites();
  };

  const handleRemoveRecent = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    removeRecentFile(path);
    refreshRecent();
  };

  const handleClearRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    clearRecentFiles();
    refreshRecent();
  };

  const handleFavoriteClick = async (item: FavoriteItem) => {
    if (onFavoriteClick) {
      onFavoriteClick(item.path);
    } else {
      try {
        await openFile(item.path);
      } catch {}
    }
  };

  const handleRecentClick = async (item: RecentItem) => {
    if (onRecentClick) {
      onRecentClick(item.path);
    } else {
      try {
        await openFile(item.path);
      } catch {}
    }
  };

  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header">
        <span className="sidebar-title">Finder_All</span>
        <button className="sidebar-toggle" onClick={onToggle}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>
      </div>

      <div className="sidebar-content">
        {!collapsed && favorites.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>⭐ 收藏</span>
            </div>
            {favorites.slice(0, 10).map((item) => (
              <div
                key={item.path}
                className="sidebar-item"
                title={item.path}
                onClick={() => handleFavoriteClick(item)}
              >
                <svg
                  className="sidebar-item-icon favorite-star"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span className="sidebar-item-name">{item.name}</span>
                <button
                  className="sidebar-item-remove"
                  onClick={(e) => handleRemoveFavorite(e, item.path)}
                  title="移除收藏"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {!collapsed && recentFiles.length > 0 && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">
              <span>🕐 最近打开</span>
              <button
                onClick={handleClearRecent}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--text-muted)",
                  fontSize: "11px",
                  cursor: "pointer",
                }}
                title="清空历史"
              >
                清空
              </button>
            </div>
            {recentFiles.slice(0, 10).map((item) => (
              <div
                key={item.path}
                className="sidebar-item"
                title={item.path}
                onClick={() => handleRecentClick(item)}
              >
                <svg
                  className="sidebar-item-icon"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  {item.is_dir ? (
                    <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
                  ) : (
                    <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                  )}
                </svg>
                <span className="sidebar-item-name">{item.name}</span>
                <button
                  className="sidebar-item-remove"
                  onClick={(e) => handleRemoveRecent(e, item.path)}
                  title="移除"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-section">
          <div className="sidebar-section-label">索引目录</div>
          {indexPaths.map((path) => (
            <div
              key={path}
              className="sidebar-item"
              title={path}
              onContextMenu={(e) => {
                e.preventDefault();
                if (!collapsed) handleRemovePath(path);
              }}
            >
              <svg
                className="sidebar-item-icon"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M10 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2h-8l-2-2z" />
              </svg>
              <span className="sidebar-item-text">{path}</span>
            </div>
          ))}
        </div>
      </div>

      {!collapsed && (
        <div className="sidebar-footer">
          {showAddDialog ? (
            <div className="add-path-input">
              <input
                type="text"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddPath()}
                placeholder="输入目录路径..."
                autoFocus
              />
              <button onClick={handleAddPath}>添加</button>
              <button onClick={() => setShowAddDialog(false)}>取消</button>
            </div>
          ) : (
            <button
              className="sidebar-btn"
              onClick={() => setShowAddDialog(true)}
              style={{ marginBottom: "8px" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              <span className="sidebar-btn-text">添加目录</span>
            </button>
          )}
          <button
            className="sidebar-btn"
            onClick={onRebuildIndex}
            style={{ background: "var(--bg-tertiary)" }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            <span className="sidebar-btn-text">重建索引</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
