import { useState, useCallback } from 'react';
import { Map, PanelRight, RotateCcw } from 'lucide-react';
import CrawlForm from './components/CrawlForm';
import ProgressBar from './components/ProgressBar';
import FlowDiagram from './components/FlowDiagram';
import GlobalNavPanel from './components/GlobalNavPanel';
import { startCrawl } from './utils/api';
import './App.css';

/**
 * App has three states:
 * 1. INPUT   — user enters a URL and configures settings
 * 2. LOADING — crawl is in progress, showing progress bar
 * 3. RESULT  — flow diagram is displayed with global nav sidebar
 */
export default function App() {
  const [state, setState] = useState('input'); // 'input' | 'loading' | 'result' | 'error'
  const [progress, setProgress] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSubmit = useCallback(async ({ url, maxDepth, maxPages }) => {
    setState('loading');
    setProgress(null);
    setError(null);
    setFlowData(null);

    await startCrawl({
      url,
      maxDepth,
      maxPages,
      onProgress: (data) => {
        setProgress(data);
      },
      onComplete: (data) => {
        setFlowData(data);
        setState('result');
      },
      onError: (message) => {
        setError(message);
        setState('error');
      },
    });
  }, []);

  const handleReset = () => {
    setState('input');
    setProgress(null);
    setFlowData(null);
    setError(null);
  };

  // ─── INPUT / LOADING screen ───
  if (state === 'input' || state === 'loading' || state === 'error') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex flex-col items-center justify-center px-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Map size={24} className="text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">FlowMapper</h1>
        </div>
        <p className="text-sm text-gray-400 mb-8 text-center max-w-md">
          Enter a website URL to intelligently crawl and map its user navigation flows.
        </p>

        <CrawlForm onSubmit={handleSubmit} isLoading={state === 'loading'} />

        {state === 'loading' && <ProgressBar progress={progress} />}

        {state === 'error' && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl max-w-xl w-full">
            <p className="text-sm text-red-600">{error}</p>
            <button
              onClick={handleReset}
              className="mt-2 text-xs text-red-500 hover:text-red-700 underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ─── RESULT screen ───
  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Map size={18} className="text-blue-600" />
            <span className="font-semibold text-sm text-gray-700">FlowMapper</span>
          </div>
          {flowData?.stats && (
            <span className="text-xs text-gray-400">
              {flowData.stats.totalNodes} nodes, {flowData.stats.totalEdges} connections
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
            title="Toggle sidebar"
          >
            <PanelRight size={18} />
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RotateCcw size={14} />
            New Crawl
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        <FlowDiagram flowData={flowData} />
        <GlobalNavPanel
          globalNav={flowData?.globalNav || []}
          stats={flowData?.stats}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
      </div>
    </div>
  );
}
