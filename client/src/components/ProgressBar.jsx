import { Loader2 } from 'lucide-react';

export default function ProgressBar({ progress }) {
  if (!progress) return null;

  const percent = progress.maxPages
    ? Math.min(Math.round((progress.pagesVisited / progress.maxPages) * 100), 100)
    : 0;

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <Loader2 size={14} className="text-blue-500 animate-spin" />
        <span className="text-sm text-gray-500">
          Crawling... {progress.pagesVisited} pages visited
        </span>
      </div>

      <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-500 rounded-full transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      {progress.currentTitle && (
        <p className="mt-2 text-xs text-gray-400 truncate">
          Currently visiting: {progress.currentTitle}
        </p>
      )}
    </div>
  );
}
