import { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import FilePreview from "./components/FilePreview";
import HelpPanel from "./components/HelpPanel";
import EmptyState from "./components/EmptyState";
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

      if (showHelp) {
        if (e.key === "Escape") {
          setShowHelp(false);
        }
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
      } else if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>(".search-input")?.focus();
      }
    },
    [results, selectedIndex, query, previewFile, showHelp, handleOpenFile, handleToggleFavorite]
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
          />
        )}
        {results.length > 0 && (
          <FileList
            files={results}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
            onOpen={handleOpenFile}
            onFavoritesChange={refreshSidebar}
          />
        )}
        <StatusBar indexProgress={indexProgress} resultCount={results.length} />
      </div>
      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      {showHelp && <HelpPanel onClose={() => setShowHelp(false)} />}
    </div>
  );
}

export default App;
