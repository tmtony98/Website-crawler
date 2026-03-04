/**
 * API utility for communicating with the backend.
 *
 * Uses fetch with Server-Sent Events (SSE) to receive real-time
 * progress updates during crawling.
 */

/**
 * Start a crawl and receive progress updates via callback.
 *
 * How SSE works here:
 * 1. We POST the crawl config to the server
 * 2. The server starts crawling and sends events as it progresses
 * 3. We read the response body as a stream, parsing each event
 * 4. We call onProgress/onComplete/onError callbacks for each event type
 */
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

    // Read the SSE stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE format: each event is "data: {...}\n\n"
      const events = buffer.split('\n\n');
      // Keep the last incomplete chunk in the buffer
      buffer = events.pop() || '';

      for (const event of events) {
        const dataLine = event.trim();
        if (!dataLine.startsWith('data: ')) continue;

        const jsonStr = dataLine.slice(6); // Remove "data: " prefix
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
          // Ignore malformed JSON chunks
        }
      }
    }
  } catch (error) {
    if (onError) onError(error.message);
  }
}
