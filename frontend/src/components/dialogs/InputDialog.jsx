import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function InputDialog({
  open,
  title,
  initialValue = '',
  placeholder,
  confirmLabel = 'Save',
  suggestions,
  onConfirm,
  onCancel,
}) {
  const inputRef = useRef();

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);
    return () => clearTimeout(t);
  }, [open]);

  if (!open) return null;

  function handleSubmit(e) {
    e.preventDefault();
    const value = inputRef.current.value.trim();
    if (value) onConfirm(value);
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onCancel}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
      >
        <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
        <input
          ref={inputRef}
          defaultValue={initialValue}
          placeholder={placeholder}
          list={suggestions?.length ? 'input-dialog-suggestions' : undefined}
          onKeyDown={(e) => e.key === 'Escape' && onCancel()}
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:focus:ring-indigo-500/20"
        />
        {suggestions?.length > 0 && (
          <datalist id="input-dialog-suggestions">
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1.5 text-sm text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500"
          >
            {confirmLabel}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}
