import { Archive, FileCode, FileText, Image, Music, File as FileIcon, Video } from 'lucide-react';

export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / 1024 ** i).toFixed(1)} ${units[i]}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function iconForMime(mimetype = '') {
  if (mimetype.startsWith('image/')) return Image;
  if (mimetype.startsWith('video/')) return Video;
  if (mimetype.startsWith('audio/')) return Music;
  if (/zip|rar|tar|7z|gzip/.test(mimetype)) return Archive;
  if (/javascript|json|xml|html|css/.test(mimetype)) return FileCode;
  if (/pdf|word|officedocument|text\/plain/.test(mimetype)) return FileText;
  return FileIcon;
}
