import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import FilePreview from "./components/FilePreview";
import HelpPanel from "./components/HelpPanel";
import EmptyState from "./components/EmptyState";
import CommandPanel, { type CommandAction } from "./components/CommandPanel";
import {
  searchFiles,
  getIndexStatus,
  getIndexPaths,
  rebuildIndex,
  hideWindow,
  addSearchHistory,
  openFile,
  addRecentFile,
  addFavorite,
  isFavorite,
  removeFavorite,
  clearSearchHistory,
} from "./api";
import type { FileItem, IndexProgress, FileCategory } from "./types";
import { CATEGORY_EXTENSIONS } from "./types";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [indexProgress, setIndexProgress] = useState<IndexProgress | null>(null);
  const [indexPaths, setIndexPaths] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sortBy, setSortBy] = useState("relevance");
  const [sortDesc, setSortDesc] = useState(false);
  const [category, setCategory] = useState<FileCategory>("all");
  const [matchPath, setMatchPath] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const [showCommandPanel, setShowCommandPanel] = useState(false);
  const [sidebarRefreshKey, setSidebarRefreshKey] = useState(0);
  const searchTimeoutRef = useRef<number | null>(null);

  const refreshSidebar = () => {
    setSidebarRefreshKey((prev) => prev + 1);
  };

  const loadIndexPaths = useCallback(async () => {
    try {
      const paths = await getIndexPaths();
      setIndexPaths(paths);
    } catch (e) {
      console.error("Failed to load index paths:", e);
    }
  }, []);

  const loadIndexStatus = useCallback(async () => {
    try {
      const status = await getIndexStatus();
      setIndexProgress(status);
    } catch (e) {
      console.error("Failed to get index status:", e);
    }
  }, []);

  const getExtensionsForCategory = (cat: FileCategory): string[] => {
    if (cat === "all" || cat === "folder") return [];
    return CATEGORY_EXTENSIONS[cat as Exclude<FileCategory, "all" | "folder">];
  };

  const getFileTypeForCategory = (cat: FileCategory): "all" | "file" | "dir" => {
    if (cat === "folder") return "dir";
    return "all";
  };

  const performSearch = useCallback(
    async (searchQuery: string, cat: FileCategory, sort: string, desc: boolean, matchP: boolean) => {
      if (!searchQuery.trim() && cat === "all" && !matchP) {
        setResults([]);
        return;
      }
      try {
        const files = await searchFiles({
          query: searchQuery,
          extensions: getExtensionsForCategory(cat),
          file_type: getFileTypeForCategory(cat),
          sort_by: sort,
          sort_desc: desc,
          match_path: matchP,
        });
        setResults(files);
        setSelectedIndex(0);
      } catch (e) {
        console.error("Search failed:", e);
      }
    },
    []
  );

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = window.setTimeout(() => {
        performSearch(value, category, sortBy, sortDesc, matchPath);
      }, 100);
    },
    [performSearch, category, sortBy, sortDesc, matchPath]
  );

  const handleHistorySelect = useCallback(
    (historyQuery: string) => {
      setQuery(historyQuery);
      performSearch(historyQuery, category, sortBy, sortDesc, matchPath);
      addSearchHistory(historyQuery);
    },
    [performSearch, category, sortBy, sortDesc, matchPath]
  );

  const handleSortChange = useCallback(
    (sort: string, desc: boolean) => {
      setSortBy(sort);
      setSortDesc(desc);
      performSearch(query, category, sort, desc, matchPath);
    },
    [performSearch, query, category, matchPath]
  );

  const handleCategoryChange = useCallback(
    (cat: FileCategory) => {
      setCategory(cat);
      performSearch(query, cat, sortBy, sortDesc, matchPath);
    },
    [performSearch, query, sortBy, sortDesc, matchPath]
  );

  const handleMatchPathChange = useCallback(
    (v: boolean) => {
      setMatchPath(v);
      performSearch(query, category, sortBy, sortDesc, v);
    },
    [performSearch, query, category, sortBy, sortDesc]
  );

  const handleOpenFile = useCallback(
    async (file: FileItem) => {
      if (query.trim()) {
        addSearchHistory(query.trim());
      }
      addRecentFile(file);
      refreshSidebar();
      try {
        await openFile(file.path);
      } catch (e) {
        console.error("Failed to open file:", e);
      }
    },
    [query]
  );

  const handleToggleFavorite = useCallback(() => {
    if (results[selectedIndex]) {
      const file = results[selectedIndex];
      if (isFavorite(file.path)) {
        removeFavorite(file.path);
      } else {
        addFavorite(file);
      }
      refreshSidebar();
    }
  }, [results, selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "F1") {
        e.preventDefault();
        setShowHelp(true);
        return;
      }

      // 命令面板打开时，键盘事件由其内部处理
      if (showCommandPanel) return;

      if (showHelp) {
        if (e.key === "Escape") {
          setShowHelp(false);
        }
        return;
      }

      // Cmd/Ctrl+K 打开命令面板
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPanel(true);
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        handleOpenFile(results[selectedIndex]);
      } else if (e.key === " ") {
        e.preventDefault();
        if (results[selectedIndex] && !previewFile) {
          setPreviewFile(results[selectedIndex]);
        } else if (previewFile) {
          setPreviewFile(null);
        }
      } else if (e.key === "Escape") {
        if (previewFile) {
          setPreviewFile(null);
        } else if (query) {
          setQuery("");
          setResults([]);
        } else {
          hideWindow();
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key === "d") {
        e.preventDefault();
        handleToggleFavorite();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "o" && results[selectedIndex]) {
        e.preventDefault();
        handleOpenFile(results[selectedIndex]);
      } else if ((e.metaKey || e.ctrlKey) && e.key === "l" && results[selectedIndex]) {
        e.preventDefault();
        import("./api").then(({ openFileLocation }) =>
          openFileLocation(results[selectedIndex].path)
        );
      } else if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        // 已被全局快捷键处理，但保险一下
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".search-input")?.focus();
      }
    },
    [results, selectedIndex, query, previewFile, showHelp, showCommandPanel, handleOpenFile, handleToggleFavorite]
  );

  // 命令面板操作列表
  const commandActions = useMemo<CommandAction[]>(
    () => [
      {
        id: "rebuild-index",
        title: "重建索引",
        subtitle: "重新扫描所有索引目录",
        icon: "🔄",
        shortcut: "",
        group: "操作",
        run: () => {
          rebuildIndex();
        },
      },
      {
        id: "clear-search",
        title: "清空当前搜索",
        subtitle: "重置搜索框与结果",
        icon: "🧹",
        group: "操作",
        run: () => {
          setQuery("");
          setResults([]);
        },
      },
      {
        id: "clear-history",
        title: "清空搜索历史",
        subtitle: "删除全部历史搜索记录",
        icon: "🗑️",
        group: "操作",
        run: () => {
          clearSearchHistory();
        },
      },
      {
        id: "hide-window",
        title: "隐藏窗口",
        subtitle: "后台运行，快捷键再次呼出",
        icon: "🙈",
        shortcut: "Esc",
        group: "操作",
        run: () => hideWindow(),
      },
      {
        id: "toggle-sidebar",
        title: sidebarCollapsed ? "展开侧边栏" : "折叠侧边栏",
        subtitle: "切换侧边栏显示状态",
        icon: sidebarCollapsed ? "📖" : "📕",
        group: "视图",
        run: () => setSidebarCollapsed((v) => !v),
      },
      {
        id: "focus-search",
        title: "聚焦搜索框",
        subtitle: "立刻开始输入搜索",
        icon: "🔍",
        group: "视图",
        run: () => {
          document.querySelector<HTMLInputElement>(".search-input")?.focus();
        },
      },
      {
        id: "preview-selected",
        title: "预览选中文件",
        subtitle: "查看当前选中文件的详细信息",
        icon: "👁️",
        shortcut: "Space",
        group: "视图",
        run: () => {
          if (results[selectedIndex]) setPreviewFile(results[selectedIndex]);
        },
      },
      {
        id: "show-help",
        title: "查看帮助",
        subtitle: "快捷键、搜索语法、使用技巧",
        icon: "❓",
        shortcut: "F1",
        group: "帮助",
        run: () => setShowHelp(true),
      },
    ],
    [sidebarCollapsed, results, selectedIndex]
  );

  const handleRebuildIndex = useCallback(async () => {
    try {
      await rebuildIndex();
    } catch (e) {
      console.error("Failed to rebuild index:", e);
    }
  }, []);

  useEffect(() => {
    loadIndexPaths();
    loadIndexStatus();
    const interval = setInterval(loadIndexStatus, 1000);
    return () => clearInterval(interval);
  }, [loadIndexPaths, loadIndexStatus]);

  return (
    <div className="app" onKeyDown={handleKeyDown} tabIndex={0}>
      <Sidebar
        key={sidebarRefreshKey}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        indexPaths={indexPaths}
        onPathsChange={loadIndexPaths}
        onRebuildIndex={handleRebuildIndex}
      />
      <div className="main-content">
        <SearchBar
          query={query}
          onSearch={handleSearch}
          resultCount={results.length}
          sortBy={sortBy}
          onSortChange={handleSortChange}
          sortDesc={sortDesc}
          category={category}
          onCategoryChange={handleCategoryChange}
          matchPath={matchPath}
          onMatchPathChange={handleMatchPathChange}
          onHistorySelect={handleHistorySelect}
          onHelpClick={() => setShowHelp(true)}
        />
        {results.length === 0 && !query && indexProgress && indexProgress.total_files === 0 && (
          <EmptyState
            isIndexing={!indexProgress.done}
            fileCount={indexProgress.indexed}
            onHelpClick={() => setShowHelp(true)}
            onCommandPanelClick={() => setShowCommandPanel(true)}
          />
        )}
        {results.length > 0 && (
          <FileList
            files={results}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onOpen={handleOpenFile}
            onFavoritesChange={refreshSidebar}
            query={query}
          />
        )}
        <StatusBar indexProgress={indexProgress} resultCount={results.length} />
      </div>
      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
      <CommandPanel
        open={showCommandPanel}
        onClose={() => setShowCommandPanel(false)}
        actions={commandActions}
      />
    </div>
  );
}

export default App;
