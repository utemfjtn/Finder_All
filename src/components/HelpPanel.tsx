import React from "react";

interface HelpPanelProps {
  onClose: () => void;
}

const HelpPanel: React.FC<HelpPanelProps> = ({ onClose }) => {
  const syntaxItems = [
    {
      title: "基础搜索",
      items: [
        { syntax: "关键词", desc: "模糊匹配文件名，支持中英文" },
        { syntax: "exact:", desc: "精确匹配，如 exact:report.pdf" },
      ],
    },
    {
      title: "通配符",
      items: [
        { syntax: "*", desc: "匹配任意字符，如 *.pdf" },
        { syntax: "?", desc: "匹配单个字符，如 doc?.txt" },
      ],
    },
    {
      title: "正则表达式",
      items: [
        { syntax: "regex:", desc: "正则匹配，如 regex:^report_\\d+" },
        { syntax: "path:", desc: "匹配路径，如 path:documents/report" },
      ],
    },
    {
      title: "大小过滤",
      items: [
        { syntax: "size:>10MB", desc: "大于 10MB 的文件" },
        { syntax: "size:<1GB", desc: "小于 1GB 的文件" },
        { syntax: "size:10MB-100MB", desc: "大小在 10MB 到 100MB 之间" },
      ],
    },
    {
      title: "日期过滤",
      items: [
        { syntax: "date:>2024-01-01", desc: "2024年1月1日之后修改" },
        { syntax: "date:<2024-12-31", desc: "2024年12月31日之前修改" },
        { syntax: "date:2024-01-01..2024-12-31", desc: "日期范围" },
      ],
    },
    {
      title: "组合使用",
      items: [
        { syntax: "*.pdf size:>5MB", desc: "大于 5MB 的 PDF 文件" },
        { syntax: "report path:documents", desc: "路径中包含 documents 的 report 文件" },
      ],
    },
  ];

  const shortcuts = [
    { key: "Cmd/Ctrl + Shift + F", desc: "全局呼出/隐藏窗口" },
    { key: "↑ / ↓", desc: "选择搜索结果" },
    { key: "Enter", desc: "打开选中文件" },
    { key: "Space", desc: "快速预览文件" },
    { key: "Esc", desc: "关闭预览 / 清空搜索 / 隐藏窗口" },
    { key: "Cmd/Ctrl + O", desc: "打开文件" },
    { key: "Cmd/Ctrl + L", desc: "打开所在文件夹" },
    { key: "Cmd/Ctrl + D", desc: "收藏/取消收藏" },
    { key: "Cmd/Ctrl + C", desc: "复制文件路径" },
  ];

  return (
    <div className="help-panel-overlay" onClick={onClose}>
      <div className="help-panel" onClick={(e) => e.stopPropagation()}>
        <div className="help-panel-header">
          <h2>使用帮助</h2>
          <button className="help-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="help-panel-content">
          <div className="help-section">
            <h3>🚀 搜索语法</h3>
            {syntaxItems.map((section, idx) => (
              <div key={idx} className="help-subsection">
                <h4>{section.title}</h4>
                <div className="help-syntax-list">
                  {section.items.map((item, i) => (
                    <div key={i} className="help-syntax-item">
                      <code className="help-syntax-code">{item.syntax}</code>
                      <span className="help-syntax-desc">{item.desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="help-section">
            <h3>⌨️ 快捷键</h3>
            <div className="help-shortcuts-list">
              {shortcuts.map((item, idx) => (
                <div key={idx} className="help-shortcut-item">
                  <kbd className="help-shortcut-key">{item.key}</kbd>
                  <span className="help-shortcut-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="help-section">
            <h3>💡 小贴士</h3>
            <ul className="help-tips-list">
              <li>首次启动会自动建立索引，索引完成后搜索速度最快</li>
              <li>索引文件自动缓存到本地，下次启动秒级加载</li>
              <li>文件变化自动增量更新，无需手动重建索引</li>
              <li>点击分类标签可快速筛选文件类型</li>
              <li>右键文件可查看更多操作选项</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPanel;
