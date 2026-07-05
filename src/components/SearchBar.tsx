import React, { useState, useRef, useEffect } from "react";
import { FileCategory, CATEGORY_EXTENSIONS } from "../types";

interface SearchBarProps {
  query: string;
  onSearch: (value: string) => void;
  resultCount: number;
  sortBy: string;
  onSortChange: (sort: string, desc: boolean) => void;
  sortDesc: boolean;
  category: FileCategory;
  onCategoryChange: (cat: FileCategory) => void;
  matchPath: boolean;
  onMatchPathChange: (v: boolean) => void;
}

const sortOptions = [
  { value: "relevance", label: "相关性" },
  { value: "name", label: "名称" },
  { value: "size", label: "大小" },
  { value: "modified", label: "修改时间" },
  { value: "path", label: "路径" },
  { value: "type", label: "类型" },
];

const categories: { value: FileCategory; label: string; icon: string }[] = [
  { value: "all", label: "全部", icon: "📁" },
  { value: "folder", label: "文件夹", icon: "📂" },
  { value: "document", label: "文档", icon: "📄" },
  { value: "image", label: "图片", icon: "🖼️" },
  { value: "audio", label: "音频", icon: "🎵" },
  { value: "video", label: "视频", icon: "🎬" },
  { value: "compressed", label: "压缩包", icon: "📦" },
  { value: "executable", label: "程序", icon: "⚙️" },
];

const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onSearch,
  resultCount,
  sortBy,
  onSortChange,
  sortDesc,
  category,
  onCategoryChange,
  matchPath,
  onMatchPathChange,
}) => {
  const [showSortMenu, setShowSortMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const sortMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentSort = sortOptions.find((s) => s.value === sortBy)?.label || "相关性";

  return (
    <div className="search-container">
      <div className="search-bar">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          className="search-input"
          placeholder="搜索文件和文件夹... (支持 * ? 通配符)"
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          autoFocus
        />
        {query && (
          <button
            className="search-clear"
            onClick={() => onSearch("")}
            title="清除"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <span className="search-info">
          {resultCount} 个结果
        </span>
      </div>

      <div className="search-toolbar">
        <div className="category-tabs">
          {categories.map((cat) => (
            <button
              key={cat.value}
              className={`category-tab ${category === cat.value ? "active" : ""}`}
              onClick={() => onCategoryChange(cat.value)}
              title={cat.label}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>

        <div className="search-options">
          <label className="option-toggle" title="同时搜索路径">
            <input
              type="checkbox"
              checked={matchPath}
              onChange={(e) => onMatchPathChange(e.target.checked)}
            />
            <span>匹配路径</span>
          </label>

          <div className="sort-menu-container" ref={sortMenuRef}>
            <button
              className="sort-btn"
              onClick={() => setShowSortMenu(!showSortMenu)}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M6 12h12M10 18h4" />
              </svg>
              <span>{currentSort}</span>
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                style={{ transform: sortDesc ? "rotate(180deg)" : "none" }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {showSortMenu && (
              <div className="sort-dropdown">
                {sortOptions.map((opt) => (
                  <div
                    key={opt.value}
                    className={`sort-item ${sortBy === opt.value ? "active" : ""}`}
                    onClick={() => {
                      if (sortBy === opt.value) {
                        onSortChange(opt.value, !sortDesc);
                      } else {
                        onSortChange(opt.value, false);
                      }
                      setShowSortMenu(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {sortBy === opt.value && (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points={sortDesc ? "6 15 12 9 18 15" : "6 9 12 15 18 9"} />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
