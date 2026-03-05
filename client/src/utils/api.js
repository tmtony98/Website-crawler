export async function startCrawl({ url, maxDepth, maxPages, onProgress, onComplete, onError }) {
  try {
    const response = await fetch('/api/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, maxDepth, maxPages }),
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Crawl request failed');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const dataLine = event.trim();
        if (!dataLine.startsWith('data: ')) continue;

        const jsonStr = dataLine.slice(6);
        try {
          const data = JSON.parse(jsonStr);

          if (data.type === 'progress' && onProgress) {
            onProgress(data);
          } else if (data.type === 'complete' && onComplete) {
            onComplete(data.data);
          } else if (data.type === 'error' && onError) {
            onError(data.message);
          }
        } catch {
          // malformed SSE chunk
        }
      }
    }
  } catch (error) {
    if (onError) onError(error.message);
  }
}
