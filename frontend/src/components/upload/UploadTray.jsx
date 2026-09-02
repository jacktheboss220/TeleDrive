export default function UploadTray({ uploads }) {
  if (uploads.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40 w-72 rounded-xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 dark:border-zinc-800 dark:text-zinc-200">
        Uploading {uploads.length} file{uploads.length > 1 ? 's' : ''}
      </div>
      <div className="max-h-64 space-y-3 overflow-y-auto p-3">
        {uploads.map((u) => (
          <div key={u.id}>
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-xs text-zinc-600 dark:text-zinc-300">{u.name}</p>
              <span className="shrink-0 text-[10px] text-zinc-400">{u.progress}%</span>
            </div>
            <p className="text-[10px] text-zinc-400">
              {u.phase === 'sending' ? 'Sending to Telegram…' : 'Uploading…'}
            </p>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${u.progress}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
