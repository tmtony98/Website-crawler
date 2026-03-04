import express from 'express';
import cors from 'cors';
import { crawlWebsite } from './crawler.js';
import { extractFlow } from './flowExtractor.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

/**
 * POST /api/crawl
 *
 * Starts a crawl and streams progress via Server-Sent Events (SSE).
 *
 * SSE = Server-Sent Events. It's a simple way for the server to push
 * real-time updates to the client over a single HTTP connection.
 * Think of it like a one-way live stream of data.
 *
 * Events sent:
 *   { type: "progress", pagesVisited, maxPages, currentUrl, currentTitle }
 *   { type: "complete", data: { nodes, edges, globalNav, stats } }
 *   { type: "error", message }
 */
app.post('/api/crawl', async (req, res) => {
  const { url, maxDepth = 3, maxPages = 50 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  // Validate URL format
  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  // Set up SSE headers — this tells the browser to expect a stream of events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  // Helper to send an SSE event
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // Start crawling with progress callback
    const crawlData = await crawlWebsite({
      url,
      maxDepth: Math.min(maxDepth, 5), // Cap at 5 to prevent runaway crawls
      maxPages: Math.min(maxPages, 200), // Cap at 200
      onProgress: (progress) => {
        sendEvent(progress);
      },
    });

    // Extract the smart flow from raw crawl data
    const flow = extractFlow(crawlData);

    sendEvent({ type: 'complete', data: flow });
  } catch (error) {
    console.error('Crawl error:', error);
    sendEvent({ type: 'error', message: error.message || 'Crawl failed' });
  } finally {
    res.end();
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
