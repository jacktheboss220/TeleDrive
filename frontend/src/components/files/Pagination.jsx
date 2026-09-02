import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-4 py-6 text-sm">
      <button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 disabled:opacity-30 dark:border-zinc-800"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="text-zinc-500">
        Page {page} of {pages}
      </span>
      <button
        disabled={page >= pages}
        onClick={() => onChange(page + 1)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 disabled:opacity-30 dark:border-zinc-800"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
