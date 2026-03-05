import { useState, useCallback } from 'react';
import { Map } from 'lucide-react';
import CrawlForm from './components/CrawlForm';
import ProgressBar from './components/ProgressBar';
import FlowDiagram from './components/FlowDiagram';
import { startCrawl } from './utils/api';
import './App.css';

export default function App() {
  const [state, setState] = useState('idle');
  const [progress, setProgress] = useState(null);
  const [flowData, setFlowData] = useState(null);
  const [error, setError] = useState(null);

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
        setState('done');
      },
      onError: (message) => {
        setError(message);
        setState('error');
      },
    });
  }, []);

  return (
    <div className="h-screen flex bg-white">
      <div className="w-80 shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col overflow-y-auto">
        <div className="px-4 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 rounded-lg">
              <Map size={20} className="text-blue-600" />
            </div>
            <h1 className="text-lg font-bold text-gray-800">FlowMapper</h1>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Intelligent website user flow mapping
          </p>
        </div>

        <div className="p-4 flex-1">
          <CrawlForm onSubmit={handleSubmit} isLoading={state === 'loading'} />

          {state === 'loading' && (
            <div className="mt-4">
              <ProgressBar progress={progress} />
            </div>
          )}

          {state === 'error' && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{error}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {state === 'done' && flowData ? (
          <FlowDiagram flowData={flowData} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-300">
            <div className="text-center">
              <Map size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">Enter a URL and start crawling to see user flows</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
