<div align="center">

# 🔍 Finder_All

### 最强 · 最美 · 最快 · 最简单的跨平台文件搜索工具

让任何人 3 秒钟找到任何文件 —— 无需学习，下载即用。

</div>

---

## 🚀 一键下载（选一个就行）

| 你的系统 | 点击下载 | 说明 |
|:--------:|:--------:|:-----|
| 🪟 **Windows** | [`.msi` 安装包](../../releases/latest) | 推荐 · 双击安装 |
| 🍎 **macOS** (M1/M2/M3/M4/Intel) | [`.dmg` Universal](../../releases/latest) | 一个包适配所有 Mac |
| 🐧 **Linux** | [`.AppImage`](../../releases/latest) · [`.deb`](../../releases/latest) | AppImage 免安装即用 |

> 💡 不知道选哪个？打开 [Releases 页面](../../releases/latest)，浏览器会自动高亮你系统对应的安装包。

---

## ✨ 为什么选 Finder_All

| 特性 | Finder_All | Everything | macOS Spotlight | 文件管理器 |
|:-----|:----------:|:---------:|:---------------:|:---------:|
| ⚡ 毫秒级搜索 | ✅ | ✅ | ⚠️ 较慢 | ❌ 极慢 |
| 🎨 现代化 UI | ✅ | ❌ 旧界面 | ✅ | ❌ |
| 🌐 跨平台 | ✅ Win/Mac/Linux | ❌ 仅 Windows | ❌ 仅 macOS | ✅ |
| ⌨️ 全局快捷键 | ✅ | ✅ | ✅ | ❌ |
| 🖼️ 文件类型彩色图标 | ✅ | ❌ | ⚠️ | ✅ |
| ⭐ 收藏 / 🕘 最近打开 | ✅ | ❌ | ⚠️ | ⚠️ |
| 👁️ 内置预览（图片/文本） | ✅ | ❌ | ✅ | ⚠️ |
| 🎯 通配符搜索 `*` `?` | ✅ | ✅ | ❌ | ⚠️ |
| 📦 一键安装 / 免配置 | ✅ | ✅ | ✅ | ✅ |

---

## 🎯 30 秒上手

```
1️⃣  下载安装 → 双击运行
2️⃣  按 Cmd/Ctrl + Shift + F 全局呼出
3️⃣  输入文件名 → 实时显示结果
4️⃣  ↑↓ 选择 → Enter 打开 / Space 预览
```

**就这么简单 —— 不需要教程，不需要配置。**

---

## ⌨️ 快捷键

| 快捷键 | 功能 |
|:------|:-----|
| `Cmd/Ctrl + Shift + F` | 🌐 全局呼出（任何应用前都可呼出） |
| `Cmd/Ctrl + K` | ⚡ 打开命令面板 |
| `↑` / `↓` | 选择搜索结果 |
| `Enter` | 打开文件 |
| `Space` | 预览文件（不打开） |
| `Cmd/Ctrl + D` | ⭐ 收藏 / 取消收藏 |
| `Cmd/Ctrl + O` | 打开所在文件夹 |
| `Cmd/Ctrl + L` | 复制文件路径 |
| `Esc` | 清空搜索 / 隐藏窗口 |
| `F1` | 查看帮助 |

---

## 🔍 搜索语法

| 输入 | 含义 |
|:----:|:-----|
| `report` | 文件名包含 report |
| `*.pdf` | 所有 PDF 文件 |
| `2024*` | 以 2024 开头的文件 |
| `*report*.docx` | 路径中包含 report 的 Word 文档 |

支持 `*`（多个字符）和 `?`（单个字符）通配符。

---

## 🛠️ 技术栈

- **前端**：React + TypeScript + Vite
- **后端**：Rust + Tauri 2.0
- **搜索**：Skim 模糊匹配 + Rayon 并行计算
- **包体**：< 10MB，启动 < 100ms

---

## 💝 开发者

```bash
# 开发
npm install
npm run tauri dev

# 构建
npm run tauri build
```

需要 Node.js ≥ 18 与 Rust ≥ 1.70。

---

## 📝 License

MIT · 欢迎贡献代码、提交 Issue、分享给朋友。
