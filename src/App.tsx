import { useState, useEffect, useCallback, useRef } from "react";
import SearchBar from "./components/SearchBar";
import FileList from "./components/FileList";
import Sidebar from "./components/Sidebar";
import StatusBar from "./components/StatusBar";
import { searchFiles, getIndexStatus, getIndexPaths, rebuildIndex } from "./api";
import type { FileItem, IndexProgress } from "./types";

function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<FileItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [indexProgress, setIndexProgress] = useState<IndexProgress | null>(null);
  const [indexPaths, setIndexPaths] = useState<string[]>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }
    try {
      const files = await searchFiles({ query: searchQuery });
      setResults(files);
      setSelectedIndex(0);
    } catch (e) {
      console.error("Search failed:", e);
    }
  }, []);

  const handleSearch = useCallback(
    (value: string) => {
      setQuery(value);
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = window.setTimeout(() => {
        performSearch(value);
      }, 150);
    },
    [performSearch]
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
        import("./api").then(({ openFile }) => openFile(results[selectedIndex].path));
      }
    },
    [results, selectedIndex]
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
        <SearchBar query={query} onSearch={handleSearch} resultCount={results.length} />
        <FileList
          files={results}
          selectedIndex={selectedIndex}
          onSelect={setSelectedIndex}
          onOpen={(file) => import("./api").then(({ openFile }) => openFile(file.path))}
        />
        <StatusBar indexProgress={indexProgress} resultCount={results.length} />
      </div>
    </div>
  );
}

export default App;
