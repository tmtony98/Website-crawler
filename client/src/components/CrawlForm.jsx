import { useState } from 'react';
import { Globe, Play, Settings2, ChevronDown, ChevronRight, Lock } from 'lucide-react';

export default function CrawlForm({ onSubmit, isLoading }) {
  const [url, setUrl] = useState('');
  const [maxDepth, setMaxDepth] = useState(3);
  const [maxPages, setMaxPages] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    let finalUrl = url.trim();
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      finalUrl = 'https://' + finalUrl;
    }

    onSubmit({ url: finalUrl, maxDepth, maxPages });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full space-y-3">
      <div className="relative">
        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter website URL"
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !url.trim()}
        className="w-full px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
      >
        <Play size={16} />
        {isLoading ? 'Crawling...' : 'Start Crawl'}
      </button>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAuth(!showAuth)}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <Lock size={13} />
          <span className="flex-1 text-left">Authenticated Access (Optional)</span>
          {showAuth ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </button>

        {showAuth && (
          <div className="px-3 pb-3 space-y-2 border-t border-gray-100">
            <div className="pt-2">
              <label className="block text-xs font-medium text-gray-500 mb-1">Username / Email</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="username@example.com"
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 rounded-md border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <Settings2 size={13} />
        {showAdvanced ? 'Hide' : 'Show'} advanced settings
      </button>

      {showAdvanced && (
        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 space-y-3">
          <div>
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
          <div>
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
