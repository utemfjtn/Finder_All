# Finder_All

一款跨平台的极速文件搜索工具，灵感来源于 Windows 的 Everything 和 macOS 的 HiTooler File Finder。

## ✨ 特性

- ⚡ **极速搜索** - 基于文件名索引，毫秒级响应
- 🔄 **实时搜索** - 输入即搜索，无需等待
- 🌐 **跨平台** - 支持 Windows、macOS、Linux
- 🎯 **模糊匹配** - 支持模糊搜索和精确匹配
- 📁 **多目录索引** - 可自定义索引目录
- 🔍 **文件过滤** - 按类型、扩展名筛选
- ⌨️ **快捷键支持** - 上下键选择，回车打开
- 🎨 **现代 UI** - 深色主题，简洁美观

## 🛠️ 技术栈

- **前端**: React + TypeScript + Vite
- **后端**: Rust + Tauri 2.0
- **搜索**: Fuzzy Matcher (Skim 算法)
- **并行**: Rayon 并行计算

## 📦 安装

### 前置要求

- Node.js >= 18
- Rust >= 1.70
- Tauri 2.0 依赖

### 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run tauri dev
```

### 构建

```bash
# 构建生产版本
npm run tauri build
```

## 🚀 使用说明

1. **首次启动** - 应用会自动索引系统根目录
2. **搜索** - 在搜索框输入关键词，实时显示结果
3. **导航** - 使用 ↑↓ 键选择，Enter 打开文件
4. **右键菜单** - 右键点击文件可打开所在位置
5. **管理索引** - 侧边栏添加/移除索引目录，重建索引

## ⌨️ 快捷键

| 快捷键 | 功能 |
|--------|------|
| `↑` / `↓` | 选择搜索结果 |
| `Enter` | 打开选中文件 |
| 右键 | 显示上下文菜单 |

## 📁 项目结构

```
.
├── src/                  # 前端源码
│   ├── components/       # React 组件
│   ├── api.ts            # Tauri 调用封装
│   ├── types.ts          # TypeScript 类型定义
│   ├── App.tsx           # 主应用组件
│   └── main.tsx          # 入口文件
├── src-tauri/            # Rust 后端
│   ├── src/
│   │   ├── main.rs       # Tauri 主入口
│   │   ├── index.rs      # 文件索引引擎
│   │   └── models.rs     # 数据模型
│   ├── Cargo.toml        # Rust 依赖
│   └── tauri.conf.json   # Tauri 配置
├── package.json
└── vite.config.ts
```

## 📝 License

MIT
