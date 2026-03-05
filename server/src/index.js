import express from 'express';
import cors from 'cors';
import { crawlWebsite } from './crawler.js';
import { extractFlow } from './flowExtractor.js';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/crawl', async (req, res) => {
  const { url, maxDepth = 3, maxPages = 50 } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    new URL(url);
  } catch {
    return res.status(400).json({ error: 'Invalid URL format' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const crawlData = await crawlWebsite({
      url,
      maxDepth: Math.min(maxDepth, 5),
      maxPages: Math.min(maxPages, 200),
      onProgress: (progress) => {
        sendEvent(progress);
      },
    });

    const flow = extractFlow(crawlData);
    sendEvent({ type: 'complete', data: flow });
  } catch (error) {
    console.error('Crawl error:', error);
    sendEvent({ type: 'error', message: error.message || 'Crawl failed' });
  } finally {
    res.end();
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
