import React from "react";

interface SearchBarProps {
  query: string;
  onSearch: (value: string) => void;
  resultCount: number;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, onSearch, resultCount }) => {
  return (
    <div className="search-container">
      <div className="search-bar">
        <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <input
          type="text"
          className="search-input"
          placeholder="搜索文件和文件夹..."
          value={query}
          onChange={(e) => onSearch(e.target.value)}
          autoFocus
        />
        {query && (
          <span className="search-info">
            {resultCount} 个结果
          </span>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
