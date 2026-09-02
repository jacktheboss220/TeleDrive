import { FolderOpen } from 'lucide-react';
import FileCard from './FileCard';

const GRID = 'grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6';

export default function FileGrid({ items, loading, onChange, onPreview, folders, selectedIds, onToggleSelect }) {
  if (loading) {
    return (
      <div className={GRID}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="animate-pulse overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
            <div className="aspect-square bg-zinc-100 dark:bg-zinc-800" />
            <div className="space-y-2 p-3">
              <div className="h-3 w-3/4 rounded bg-zinc-100 dark:bg-zinc-800" />
              <div className="h-2.5 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-zinc-900">
          <FolderOpen size={26} />
        </div>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">No files here yet</p>
        <p className="text-xs text-zinc-400">Upload something, or drag a file in.</p>
      </div>
    );
  }

  return (
    <div className={GRID}>
      {items.map((f) => (
        <FileCard
          key={f._id}
          file={f}
          onChange={onChange}
          onPreview={onPreview}
          folders={folders}
          selected={selectedIds.has(f._id)}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}
