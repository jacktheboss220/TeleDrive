import { useState } from 'react';
import { Download, FolderInput, Pencil, Trash2 } from 'lucide-react';
import { deleteFile, downloadUrl, renameFile, thumbnailUrl } from '../../api';
import { useToast } from '../../context/ToastContext';
import { formatBytes, formatDate, iconForMime } from '../../utils';
import InputDialog from '../dialogs/InputDialog';
import ConfirmDialog from '../dialogs/ConfirmDialog';

export default function FileCard({ file, onChange, onPreview, folders, selected, onToggleSelect }) {
  const toast = useToast();
  const [renaming, setRenaming] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [thumbError, setThumbError] = useState(false);
  const hasThumb = (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) && !thumbError;
  const Icon = iconForMime(file.mimetype);

  async function handleDelete() {
    setDeleting(false);
    try {
      await deleteFile(file._id);
      toast(`${file.filename} deleted`);
      onChange();
    } catch (err) {
      toast(err.message || 'Delete failed', 'error');
    }
  }

  async function handleRename(next) {
    setRenaming(false);
    if (next === file.filename) return;
    try {
      await renameFile(file._id, { filename: next });
      toast('Renamed');
      onChange();
    } catch (err) {
      toast(err.message || 'Rename failed', 'error');
    }
  }

  async function handleMove(next) {
    setMoving(false);
    if (next === file.folder) return;
    try {
      await renameFile(file._id, { folder: next });
      toast(`Moved to ${next}`);
      onChange();
    } catch (err) {
      toast(err.message || 'Move failed', 'error');
    }
  }

  async function handleTagsSave(next) {
    setEditingTags(false);
    try {
      await renameFile(file._id, { tags: next });
      toast('Tags updated');
      onChange();
    } catch (err) {
      toast(err.message || 'Failed to update tags', 'error');
    }
  }

  return (
    <div
      className={`group relative overflow-hidden rounded-xl border bg-white transition hover:shadow-md dark:bg-zinc-900 ${
        selected ? 'border-indigo-400 ring-2 ring-indigo-400/50' : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <div
        className="flex aspect-square cursor-pointer items-center justify-center bg-zinc-50 dark:bg-zinc-800/60"
        onClick={() => onPreview(file)}
      >
        <label
          className={`absolute left-2 top-2 z-10 flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-white/90 shadow transition dark:bg-zinc-900/90 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(file._id)}
            className="h-4 w-4 accent-indigo-600"
          />
        </label>

        {hasThumb ? (
          <img
            src={thumbnailUrl(file._id)}
            alt={file.filename}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={() => setThumbError(true)}
          />
        ) : (
          <Icon size={36} strokeWidth={1.5} className="text-zinc-400 dark:text-zinc-600" />
        )}

        <div
          className="absolute right-2 top-2 flex flex-col gap-1.5 opacity-0 transition group-hover:opacity-100"
          onClick={(e) => e.stopPropagation()}
        >
          <a
            href={downloadUrl(file._id)}
            title="Download"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow dark:bg-zinc-900/90 dark:text-zinc-200"
          >
            <Download size={15} />
          </a>
          <button
            onClick={() => setRenaming(true)}
            title="Rename"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow dark:bg-zinc-900/90 dark:text-zinc-200"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setMoving(true)}
            title="Move to folder"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow dark:bg-zinc-900/90 dark:text-zinc-200"
          >
            <FolderInput size={14} />
          </button>
          <button
            onClick={() => setDeleting(true)}
            title="Delete"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-red-600 shadow hover:bg-red-50 dark:bg-zinc-900/90 dark:text-red-400 dark:hover:bg-red-950/50"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <p className="truncate text-sm font-medium text-zinc-800 dark:text-zinc-100" title={file.filename}>
          {file.filename}
        </p>
        <p className="mt-0.5 text-xs text-zinc-400">
          {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1">
          {file.tags?.map((t) => (
            <span
              key={t}
              className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
            >
              {t}
            </span>
          ))}
          <button
            onClick={() => setEditingTags(true)}
            className="rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[10px] text-zinc-400 hover:border-zinc-400 hover:text-zinc-600 dark:border-zinc-700 dark:hover:border-zinc-500"
          >
            + tag
          </button>
        </div>
      </div>

      <InputDialog
        open={renaming}
        title="Rename file"
        initialValue={file.filename}
        confirmLabel="Rename"
        onConfirm={handleRename}
        onCancel={() => setRenaming(false)}
      />
      <InputDialog
        open={moving}
        title="Move to folder"
        initialValue={file.folder}
        placeholder="Folder name"
        confirmLabel="Move"
        suggestions={folders?.map((f) => f.folder)}
        onConfirm={handleMove}
        onCancel={() => setMoving(false)}
      />
      <InputDialog
        open={editingTags}
        title="Edit tags"
        initialValue={file.tags?.join(', ') || ''}
        placeholder="tag1, tag2"
        confirmLabel="Save"
        onConfirm={handleTagsSave}
        onCancel={() => setEditingTags(false)}
      />
      <ConfirmDialog
        open={deleting}
        title="Delete file"
        message={`Delete "${file.filename}"? This also removes it from Telegram.`}
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleting(false)}
      />
    </div>
  );
}
