import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Download, X } from 'lucide-react';
import { downloadUrl, previewUrl } from '../../api';
import { formatBytes, formatDate, iconForMime } from '../../utils';

export default function PreviewModal({ file, onClose }) {
  useEffect(() => {
    if (!file) return;
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [file, onClose]);

  if (!file) return null;

  const isImage = file.mimetype.startsWith('image/');
  const isVideo = file.mimetype.startsWith('video/');
  const isAudio = file.mimetype.startsWith('audio/');
  const isPdf = file.mimetype === 'application/pdf';
  const Icon = iconForMime(file.mimetype);

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{file.filename}</p>
          <p className="text-xs text-white/60">
            {formatBytes(file.size)} · {formatDate(file.uploadedAt)}
          </p>
        </div>
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <a
            href={downloadUrl(file._id)}
            title="Download"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Download size={16} />
          </a>
          <button
            onClick={onClose}
            title="Close"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center overflow-auto p-4" onClick={(e) => e.stopPropagation()}>
        {isImage && (
          <img
            src={previewUrl(file._id)}
            alt={file.filename}
            className="max-h-full max-w-full rounded-lg object-contain"
          />
        )}
        {isVideo && (
          <video src={previewUrl(file._id)} controls autoPlay className="max-h-full max-w-full rounded-lg" />
        )}
        {isAudio && (
          <div className="w-full max-w-md rounded-xl bg-white/10 p-6">
            <Icon size={40} className="mx-auto mb-4 text-white/70" />
            <audio src={previewUrl(file._id)} controls className="w-full" />
          </div>
        )}
        {isPdf && (
          <iframe src={previewUrl(file._id)} title={file.filename} className="h-full w-full max-w-3xl rounded-lg bg-white" />
        )}
        {!isImage && !isVideo && !isAudio && !isPdf && (
          <div className="flex flex-col items-center gap-3 text-white/70">
            <Icon size={56} strokeWidth={1.2} />
            <p className="text-sm">No preview available for this file type.</p>
            <a
              href={downloadUrl(file._id)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
            >
              Download instead
            </a>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
