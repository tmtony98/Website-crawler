import { Navigation, X } from 'lucide-react';

export default function GlobalNavPanel({ globalNav, stats, isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="w-80 bg-white border-l border-gray-200 h-full overflow-y-auto shadow-lg">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation size={16} className="text-gray-500" />
            <h3 className="font-semibold text-sm text-gray-700">Global Navigation</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <X size={16} className="text-gray-400" />
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">
          Links that appear on most pages — filtered from the flow to reduce noise.
        </p>
      </div>

      {stats && (
        <div className="px-4 py-3 border-b border-gray-100 grid grid-cols-2 gap-3">
          <div>
            <div className="text-lg font-bold text-gray-700">{stats.totalPagesVisited}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Pages Crawled</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">{stats.totalNodes}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Flow Nodes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">{stats.totalEdges}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Connections</div>
          </div>
          <div>
            <div className="text-lg font-bold text-gray-700">{stats.patternsDetected}</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Patterns</div>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
          Filtered Links ({globalNav.length})
        </div>
        {globalNav.length === 0 ? (
          <p className="text-xs text-gray-400">No global navigation links detected.</p>
        ) : (
          <div className="space-y-2">
            {globalNav.map((link, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-100"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm text-gray-600 truncate">{link.text}</div>
                  <div className="text-xs text-gray-400 font-mono truncate">{link.href}</div>
                </div>
                <div className="ml-2 text-[10px] text-gray-400 whitespace-nowrap">
                  {link.appearsOnPercent}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
