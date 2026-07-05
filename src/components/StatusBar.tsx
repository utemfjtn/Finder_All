import React from "react";
import type { IndexProgress } from "../types";

interface StatusBarProps {
  indexProgress: IndexProgress | null;
  resultCount: number;
}

const StatusBar: React.FC<StatusBarProps> = ({ indexProgress, resultCount }) => {
  const isIndexing = indexProgress && !indexProgress.done;
  const fileCount = indexProgress?.indexed || 0;

  return (
    <div className="status-bar">
      <div className="status-item">
        <span className={`status-indicator ${isIndexing ? "indexing" : "ready"}`} />
        <span>
          {isIndexing ? "索引中..." : "索引就绪"}
          {isIndexing && indexProgress?.current_path && (
            ` - ${indexProgress.current_path}`
          )}
        </span>
      </div>
      <div className="status-item">
        <span>已索引: {fileCount.toLocaleString()} 个文件</span>
      </div>
      <div className="status-item">
        <span>搜索结果: {resultCount.toLocaleString()}</span>
      </div>
    </div>
  );
};

export default StatusBar;
