import React from "react";

interface EmptyStateProps {
  isIndexing: boolean;
  fileCount: number;
  onHelpClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isIndexing, fileCount, onHelpClick }) => {
  const tips = [
    { icon: "⌘", key: "Cmd+Shift+F", desc: "全局呼出", group: "core" },
    { icon: "⏎", key: "Enter", desc: "打开文件", group: "core" },
    { icon: "␣", key: "Space", desc: "预览文件", group: "core" },
    { icon: "⎋", key: "Esc", desc: "隐藏窗口", group: "core" },
    { icon: "⭐", key: "Cmd+D", desc: "收藏文件", group: "action" },
    { icon: "📂", key: "Cmd+O", desc: "打开位置", group: "action" },
    { icon: "📋", key: "Cmd+L", desc: "复制路径", group: "action" },
    { icon: "❓", key: "F1", desc: "查看帮助", group: "action" },
  ];

  return (
    <div className="empty-state">
      <div className="empty-state-header">
        <div className="empty-state-icon">
          {isIndexing ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              <path d="M12 7v5l3 3" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          )}
        </div>
        <h2 className="empty-state-title">
          {isIndexing ? "正在建立索引" : "开始搜索吧"}
        </h2>
        <p className="empty-state-subtitle">
          {isIndexing
            ? `已索引 ${fileCount.toLocaleString()} 个文件，稍等片刻即可开始搜索`
            : "在上方搜索框输入关键词，毫秒级找到你的文件"}
        </p>
        {isIndexing && (
          <div className="empty-state-progress">
            <div className="empty-state-progress-bar" />
          </div>
        )}
      </div>

      <div className="empty-state-tips">
        <h3>快捷键</h3>
        <div className="tips-grid">
          {tips.map((tip, i) => (
            <div key={i} className="tip-item">
              <div className="tip-keys">
                <span className="tip-key-icon">{tip.icon}</span>
                <span className="tip-key-text">{tip.key}</span>
              </div>
              <span className="tip-desc">{tip.desc}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="empty-state-footer">
        <button className="empty-state-help-btn" onClick={onHelpClick}>
          📖 查看完整使用帮助
        </button>
      </div>
    </div>
  );
};

export default EmptyState;
