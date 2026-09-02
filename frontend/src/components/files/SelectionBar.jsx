import { FolderInput, Trash2, X } from 'lucide-react';

export default function SelectionBar({ count, onMove, onDelete, onClear }) {
  if (count === 0) return null;

  return (
    <div className="mb-4 flex items-center gap-3 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm dark:border-indigo-500/30 dark:bg-indigo-500/10">
      <span className="font-medium text-indigo-700 dark:text-indigo-300">{count} selected</span>
      <div className="flex-1" />
      <button
        onClick={onMove}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-indigo-700 hover:bg-indigo-100 dark:text-indigo-300 dark:hover:bg-indigo-500/20"
      >
        <FolderInput size={14} /> Move
      </button>
      <button
        onClick={onDelete}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
      >
        <Trash2 size={14} /> Delete
      </button>
      <button
        onClick={onClear}
        className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <X size={14} /> Clear
      </button>
    </div>
  );
}
