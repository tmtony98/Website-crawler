import { useState } from 'react';
import { Globe, Play, Settings2 } from 'lucide-react';

export default function CrawlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    // Auto-prepend https:// if missing
    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onSubmit({ url: finalUrl, maxDepth, maxPages });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-xl">
      {/* URL Input */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter website URL (e.g. example.com)"
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm transition-colors"
        >
          <Play size={16} />
          {isLoading ? 'Crawling...' : 'Map Flow'}
        </button>
      </div>

      {/* Advanced Settings Toggle */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Settings2 size={13} />
        {showAdvanced ? 'Hide' : 'Show'} advanced settings
      </button>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-100 flex gap-6">
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Crawl Depth: {maxDepth}
            </label>
            <input
              type="range"
              min={1}
              max={5}
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full accent-blue-600"
              disabled={isLoading}
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>Shallow</span>
              <span>Deep</span>
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Max Pages: {maxPages}
            </label>
            <input
              type="range"
              min={10}
              max={200}
              step={10}
              value={maxPages}
              onChange={(e) => setMaxPages(Number(e.target.value))}
              className="w-full accent-blue-600"
              disabled={isLoading}
            />
            <div className="flex justify-between text-[10px] text-gray-400 mt-0.5">
              <span>10</span>
              <span>200</span>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
