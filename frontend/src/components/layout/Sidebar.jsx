import { useState } from 'react';
import { Cloud, Folder, FolderPlus, Home, LogOut } from 'lucide-react';
import { formatBytes } from '../../utils';
import InputDialog from '../dialogs/InputDialog';

export default function Sidebar({ folders, activeFolder, onSelectFolder, onCreateFolder, totalFiles, totalSize, onLogout, open }) {
  const [creatingFolder, setCreatingFolder] = useState(false);

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-950 lg:static lg:translate-x-0 ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white">
          <Cloud size={18} />
        </div>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">TeleDrive</span>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3">
        <button onClick={() => onSelectFolder('')} className={navClass(activeFolder === '')}>
          <Home size={16} />
          <span className="flex-1 text-left">All Files</span>
          <span className="text-xs text-zinc-400">{totalFiles}</span>
        </button>

        <div className="flex items-center justify-between px-3 pb-1 pt-4">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-400">Folders</p>
          <button
            onClick={() => setCreatingFolder(true)}
            title="New folder"
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <FolderPlus size={14} />
          </button>
        </div>
        {folders.map((f) => (
          <button key={f.folder} onClick={() => onSelectFolder(f.folder)} className={navClass(activeFolder === f.folder)}>
            <Folder size={16} />
            <span className="flex-1 truncate text-left">{f.folder}</span>
            <span className="text-xs text-zinc-400">{f.count}</span>
          </button>
        ))}
      </nav>

      <div className="space-y-3 border-t border-zinc-200 p-4 dark:border-zinc-800">
        <div className="text-xs text-zinc-500 dark:text-zinc-400">
          <p className="font-medium text-zinc-700 dark:text-zinc-300">{formatBytes(totalSize)} used</p>
          <p>{totalFiles} files stored on Telegram</p>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <InputDialog
        open={creatingFolder}
        title="New folder"
        placeholder="Folder name"
        confirmLabel="Create"
        onConfirm={(name) => {
          setCreatingFolder(false);
          onCreateFolder(name);
        }}
        onCancel={() => setCreatingFolder(false)}
      />
    </aside>
  );
}

function navClass(active) {
  return `flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
    active
      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400'
      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-900'
  }`;
}
