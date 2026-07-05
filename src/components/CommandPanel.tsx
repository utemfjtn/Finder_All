import React, { useState, useEffect, useRef, useMemo } from "react";

export interface CommandAction {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  shortcut?: string;
  group: "操作" | "视图" | "帮助";
  run: () => void;
}

interface CommandPanelProps {
  open: boolean;
  onClose: () => void;
  actions: CommandAction[];
}

const CommandPanel: React.FC<CommandPanelProps> = ({ open, onClose, actions }) => {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIndex(0);
      // 延迟聚焦，避免抖动
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!query.trim()) return actions;
    const q = query.toLowerCase();
    return actions.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.subtitle?.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q)
    );
  }, [query, actions]);

  // 按 group 分组
  const grouped = useMemo(() => {
    const map = new Map<string, CommandAction[]>();
    for (const a of filtered) {
      if (!map.has(a.group)) map.set(a.group, []);
      map.get(a.group)!.push(a);
    }
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (!open) return;
    const item = listRef.current?.querySelector<HTMLElement>(`[data-idx="${selectedIndex}"]`);
    item?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex, open]);

  if (!open) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const action = filtered[selectedIndex];
      if (action) {
        action.run();
        onClose();
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  let runningIndex = -1;

  return (
    <div className="command-panel-overlay" onClick={onClose}>
      <div
        className="command-panel"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className="command-panel-input-wrapper">
          <svg
            className="command-panel-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className="command-panel-input"
            placeholder="输入命令或操作名称..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className="command-panel-esc">ESC</kbd>
        </div>

        <div className="command-panel-list" ref={listRef}>
          {filtered.length === 0 && (
            <div className="command-panel-empty">
              <span>未找到匹配的命令</span>
            </div>
          )}
          {grouped.map(([group, items]) => (
            <div key={group} className="command-panel-group">
              <div className="command-panel-group-title">{group}</div>
              {items.map((action) => {
                runningIndex += 1;
                const idx = runningIndex;
                const selected = idx === selectedIndex;
                return (
                  <div
                    key={action.id}
                    data-idx={idx}
                    className={`command-panel-item ${selected ? "selected" : ""}`}
                    onClick={() => {
                      action.run();
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <span className="command-panel-item-icon">{action.icon}</span>
                    <div className="command-panel-item-text">
                      <div className="command-panel-item-title">{action.title}</div>
                      {action.subtitle && (
                        <div className="command-panel-item-subtitle">{action.subtitle}</div>
                      )}
                    </div>
                    {action.shortcut && (
                      <kbd className="command-panel-item-shortcut">{action.shortcut}</kbd>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div className="command-panel-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>↵</kbd> 执行</span>
          <span><kbd>ESC</kbd> 关闭</span>
        </div>
      </div>
    </div>
  );
};

export default CommandPanel;
