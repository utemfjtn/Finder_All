import React from "react";

interface EmptyStateProps {
  isIndexing: boolean;
  fileCount: number;
  onHelpClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ isIndexing, fileCount, onHelpClick }) => {
  const tips = [
    { icon: "⌘", key: "Cmd + Shift + F", desc: "全局呼出搜索框" },
    { icon: "⏎", key: "Enter", desc: "打开选中文件" },
    { icon: "␣", key: "Space", desc: "预览文件内容" },
    { icon: "⭐", key: "Cmd + D", desc: "收藏/取消收藏" },
    { icon: "📂", key: "Cmd + O", desc: "打开文件所在位置" },
    { icon: "📋", key: "Cmd + L", desc: "复制文件路径" },
    { icon: "❓", key: "F1", desc: "查看帮助" },
    { icon: "⎋", key: "Esc", desc: "隐藏窗口" },
  ];

  return (
    <div className="empty-state">
      <div className="empty-state-header">
        <div className="empty-state-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </div>
        <h2 className="empty-state-title">
          {isIndexing ? "正在建立索引..." : "开始搜索吧"}
        </h2>
        <p className="empty-state-subtitle">
          {isIndexing
            ? `已索引 ${fileCount} 个文件，稍等片刻即可开始搜索`
            : "在上方搜索框输入关键词，快速找到你的文件"}
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
