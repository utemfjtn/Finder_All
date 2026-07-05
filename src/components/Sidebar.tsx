import React, { useState } from "react";
import { addIndexPath, removeIndexPath } from "../api";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  indexPaths: string[];
  onPathsChange: () => void;
  onRebuildIndex: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  indexPaths,
  onPathsChange,
  onRebuildIndex,
}) => {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newPath, setNewPath] = useState("");

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
