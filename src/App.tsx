import { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import FilePreview from "./components/FilePreview";
import {
  searchFiles,
  getIndexStatus,
  getIndexPaths,
  rebuildIndex,
  hideWindow,
  addSearchHistory,
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
  const searchTimeoutRef = useRef<number | null>(null);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === "Enter" && results[selectedIndex]) {
        e.preventDefault();
        if (query.trim()) {
          addSearchHistory(query.trim());
        }
        import("./api").then(({ openFile }) => openFile(results[selectedIndex].path));
      } else if (e.key === " ") {
        e.preventDefault();
        if (results[selectedIndex] && !previewFile) {
          setPreviewFile(results[selectedIndex]);
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
      }
    },
    [results, selectedIndex, query, previewFile]
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
    <div className="app" onKeyDown={handleKeyDown}>
      <Sidebar
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
        />
        <FileList
          files={results}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onOpen={(file) => {
            if (query.trim()) addSearchHistory(query.trim());
            import("./api").then(({ openFile }) => openFile(file.path));
          }}
        />
        <StatusBar indexProgress={indexProgress} resultCount={results.length} />
      </div>
      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}

export default App;
