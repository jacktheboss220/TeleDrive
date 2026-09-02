import { useCallback, useEffect, useState } from 'react';
import { batchDelete, batchMove, createFolder, getFolders, getTags, listFiles, uploadFile } from '../api';
import { useToast } from '../context/ToastContext';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import UploadButton from '../components/upload/UploadButton';
import UploadTray from '../components/upload/UploadTray';
import FileGrid from '../components/files/FileGrid';
import Pagination from '../components/files/Pagination';
import PreviewModal from '../components/files/PreviewModal';
import SelectionBar from '../components/files/SelectionBar';
import InputDialog from '../components/dialogs/InputDialog';
import ConfirmDialog from '../components/dialogs/ConfirmDialog';

function dateRangeParams(preset) {
  if (!preset) return {};
  const now = new Date();
  if (preset === 'today') return { from: new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString() };
  if (preset === '7d') return { from: new Date(now.getTime() - 7 * 86400000).toISOString() };
  if (preset === '30d') return { from: new Date(now.getTime() - 30 * 86400000).toISOString() };
  if (preset === 'year') return { from: new Date(now.getFullYear(), 0, 1).toISOString() };
  return {};
}

export default function Dashboard({ onLogout }) {
  const toast = useToast();
  const [data, setData] = useState({ items: [], total: 0, totalSize: 0, page: 1, pages: 1 });
  const [folders, setFolders] = useState([]);
  const [tags, setTags] = useState([]);
  const [page, setPage] = useState(1);
  const [folder, setFolder] = useState('');
  const [mime, setMime] = useState('');
  const [tag, setTag] = useState('');
  const [dateRange, setDateRange] = useState('');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploads, setUploads] = useState([]);
  const [previewFile, setPreviewFile] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkMoving, setBulkMoving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 24 };
      if (folder) params.folder = folder;
      if (mime) params.mime = mime;
      if (tag) params.tag = tag;
      if (debouncedSearch) params.q = debouncedSearch;
      Object.assign(params, dateRangeParams(dateRange));
      setData(await listFiles(params));
    } catch (err) {
      toast(err.message || 'Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, folder, mime, tag, dateRange, debouncedSearch, toast]);

  const refreshFolders = useCallback(async () => {
    try {
      setFolders(await getFolders());
    } catch {
      // sidebar folder list is non-critical, fail silently
    }
  }, []);

  const refreshTags = useCallback(async () => {
    try {
      setTags(await getTags());
    } catch {
      // tag filter is non-critical, fail silently
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await refresh();
    refreshFolders();
    refreshTags();
  }, [refresh, refreshFolders, refreshTags]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    refreshFolders();
    refreshTags();
  }, [refreshFolders, refreshTags]);

  // clear selection whenever the visible set of files changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [page, folder, mime, tag, dateRange, debouncedSearch]);

  // debounce search input before it drives a refetch
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  async function handleFiles(fileList) {
    for (const file of Array.from(fileList)) {
      const id = Date.now() + Math.random();
      setUploads((u) => [...u, { id, name: file.name, progress: 0, phase: 'uploading' }]);
      try {
        await uploadFile(file, folder || 'root', '', (pct, phase) => {
          setUploads((u) => u.map((x) => (x.id === id ? { ...x, progress: pct, phase } : x)));
        });
        toast(`${file.name} uploaded`);
      } catch (err) {
        toast(`${file.name} failed: ${err.message}`, 'error');
      } finally {
        setUploads((u) => u.filter((x) => x.id !== id));
      }
    }
    refresh();
    refreshFolders();
  }

  async function handleCreateFolder(name) {
    try {
      await createFolder(name);
      await refreshFolders();
      selectFolder(name);
    } catch (err) {
      toast(err.message || 'Failed to create folder', 'error');
    }
  }

  function selectFolder(f) {
    setFolder(f);
    setPage(1);
    setSidebarOpen(false);
  }

  function toggleSelect(id) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    setBulkDeleting(false);
    const ids = [...selectedIds];
    try {
      await batchDelete(ids);
      toast(`${ids.length} file${ids.length === 1 ? '' : 's'} deleted`);
      setSelectedIds(new Set());
      refreshAll();
    } catch (err) {
      toast(err.message || 'Bulk delete failed', 'error');
    }
  }

  async function handleBulkMove(next) {
    setBulkMoving(false);
    const ids = [...selectedIds];
    try {
      await batchMove(ids, next);
      toast(`Moved ${ids.length} file${ids.length === 1 ? '' : 's'} to ${next}`);
      setSelectedIds(new Set());
      refreshAll();
    } catch (err) {
      toast(err.message || 'Bulk move failed', 'error');
    }
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar
        folders={folders}
        activeFolder={folder}
        onSelectFolder={selectFolder}
        onCreateFolder={handleCreateFolder}
        totalFiles={data.total}
        totalSize={data.totalSize}
        onLogout={onLogout}
        open={sidebarOpen}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          search={search}
          onSearch={setSearch}
          mime={mime}
          onMime={(v) => {
            setMime(v);
            setPage(1);
          }}
          tag={tag}
          onTag={(v) => {
            setTag(v);
            setPage(1);
          }}
          tagOptions={tags}
          dateRange={dateRange}
          onDateRange={(v) => {
            setDateRange(v);
            setPage(1);
          }}
          onMenuClick={() => setSidebarOpen(true)}
        >
          <UploadButton onFiles={handleFiles} />
        </Topbar>

        <main
          className="relative flex-1 px-4 py-6 lg:px-6"
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            if (e.dataTransfer.files.length) handleFiles(e.dataTransfer.files);
          }}
        >
          {dragActive && (
            <div className="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400 bg-indigo-50/80 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
              <p className="text-sm font-medium">Drop to upload</p>
            </div>
          )}

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{folder || 'All Files'}</h2>
            <span className="text-sm text-zinc-400">
              {data.total} item{data.total === 1 ? '' : 's'}
            </span>
          </div>

          <SelectionBar
            count={selectedIds.size}
            onMove={() => setBulkMoving(true)}
            onDelete={() => setBulkDeleting(true)}
            onClear={() => setSelectedIds(new Set())}
          />

          <div className={loading && data.items.length > 0 ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
            <FileGrid
              items={data.items}
              loading={loading && data.items.length === 0}
              onChange={refreshAll}
              onPreview={setPreviewFile}
              folders={folders}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
            />
          </div>
          <Pagination page={data.page} pages={data.pages} onChange={setPage} />
        </main>
      </div>

      <UploadTray uploads={uploads} />
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />

      <InputDialog
        open={bulkMoving}
        title={`Move ${selectedIds.size} file${selectedIds.size === 1 ? '' : 's'}`}
        placeholder="Folder name"
        confirmLabel="Move"
        suggestions={folders.map((f) => f.folder)}
        onConfirm={handleBulkMove}
        onCancel={() => setBulkMoving(false)}
      />
      <ConfirmDialog
        open={bulkDeleting}
        title="Delete files"
        message={`Delete ${selectedIds.size} file${selectedIds.size === 1 ? '' : 's'}? This also removes them from Telegram.`}
        confirmLabel="Delete"
        onConfirm={handleBulkDelete}
        onCancel={() => setBulkDeleting(false)}
      />
    </div>
  );
}
