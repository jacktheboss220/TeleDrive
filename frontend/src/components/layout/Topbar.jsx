import { Menu, Search } from 'lucide-react';
import FilterDropdown from './FilterDropdown';

const MIME_OPTIONS = [
  { label: 'All types', value: '' },
  { label: 'Images', value: 'image/' },
  { label: 'Videos', value: 'video/' },
  { label: 'Audio', value: 'audio/' },
  { label: 'Documents', value: 'application/' },
];

const DATE_OPTIONS = [
  { label: 'Any time', value: '' },
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'This year', value: 'year' },
];

export default function Topbar({
  search,
  onSearch,
  mime,
  onMime,
  tag,
  onTag,
  tagOptions,
  dateRange,
  onDateRange,
  onMenuClick,
  children,
}) {
  const tagSelectOptions = [{ label: 'All tags', value: '' }, ...(tagOptions?.map((t) => ({ label: `${t.tag} (${t.count})`, value: t.tag })) ?? [])];

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80 lg:px-6">
      <button onClick={onMenuClick} className="text-zinc-500 lg:hidden">
        <Menu size={20} />
      </button>

      <div className="relative max-w-md flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
        <input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Search files..."
          className="w-full rounded-lg border border-zinc-200 bg-zinc-50 py-2 pl-9 pr-3 text-sm text-zinc-900 outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500 dark:focus:ring-indigo-500/20"
        />
      </div>

      <div className="hidden items-center gap-2 sm:flex">
        <FilterDropdown label="Type" value={mime} options={MIME_OPTIONS} onChange={onMime} />
        <FilterDropdown label="Date" value={dateRange} options={DATE_OPTIONS} onChange={onDateRange} />
        {tagOptions?.length > 0 && (
          <FilterDropdown label="Tags" value={tag} options={tagSelectOptions} onChange={onTag} />
        )}
      </div>

      <div className="flex-1" />

      {children}
    </header>
  );
}
