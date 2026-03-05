import { PlaywrightCrawler, Configuration } from 'crawlee';
import { normalizeUrl, isSameDomain } from './urlUtils.js';
import { randomUUID } from 'crypto';

export async function crawlWebsite({ url, maxDepth = 3, maxPages = 50, onProgress }) {
  const pages = [];
  const visited = new Set();
  let pagesVisited = 0;

  // Each crawl needs its own storageDir — without this, Crawlee's global request queue
  // remembers URLs from previous crawls and skips them on subsequent runs.
  const crawlId = randomUUID();
  const crawlConfig = new Configuration({
    persistStorage: false,
    purgeOnStart: true,
    storageClientOptions: {
      localDataDirectory: `/tmp/crawlee-${crawlId}`,
    },
  });

  const startOrigin = new URL(url).origin;

  const crawler = new PlaywrightCrawler({
    maxRequestsPerCrawl: maxPages,
    maxConcurrency: 3,
    requestHandlerTimeoutSecs: 30,

    launchContext: {
      launchOptions: {
        headless: true,
      },
    },

    async requestHandler({ page, request, enqueueLinks }) {
      const normalizedUrl = normalizeUrl(request.url);

      if (visited.has(normalizedUrl)) return;
      visited.add(normalizedUrl);

      if (!isSameDomain(request.url, url)) return;

      pagesVisited++;

      await page.waitForLoadState('domcontentloaded');

      const title = await page.title();

      if (onProgress) {
        onProgress({
          type: 'progress',
          pagesVisited,
          maxPages,
          currentUrl: normalizedUrl,
          currentTitle: title,
        });
      }

      const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a[href]');
        const results = [];

        for (const anchor of anchors) {
          const href = anchor.href;
          const text = anchor.textContent.trim().slice(0, 100);

          if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            continue;
          }

          // Walk the DOM to find which semantic section (nav/header/footer/main) this link is in
          let location = 'other';
          let el = anchor;
          while (el && el !== document.body) {
            const tag = el.tagName.toLowerCase();
            if (tag === 'nav') { location = 'nav'; break; }
            if (tag === 'header') { location = 'header'; break; }
            if (tag === 'footer') { location = 'footer'; break; }
            if (tag === 'main') { location = 'main'; break; }
            if (tag === 'article') { location = 'article'; break; }
            if (tag === 'aside') { location = 'aside'; break; }

            const classes = (el.className || '').toString().toLowerCase();
            const role = (el.getAttribute('role') || '').toLowerCase();
            if (classes.includes('nav') || role === 'navigation') { location = 'nav'; break; }
            if (classes.includes('header') || role === 'banner') { location = 'header'; break; }
            if (classes.includes('footer') || role === 'contentinfo') { location = 'footer'; break; }
            if (classes.includes('sidebar') || role === 'complementary') { location = 'aside'; break; }
            if (role === 'main') { location = 'main'; break; }

            el = el.parentElement;
          }

          results.push({ href, text, location });
        }

        return results;
      });

      const internalLinks = links
        .filter(link => isSameDomain(link.href, url))
        .map(link => ({
          ...link,
          href: normalizeUrl(link.href),
        }));

      pages.push({
        url: normalizedUrl,
        title: title || normalizedUrl,
        links: internalLinks,
        depth: request.userData?.depth || 0,
      });

      // Use globs instead of 'same-domain' strategy to strictly limit to start origin
      const currentDepth = request.userData?.depth || 0;
      if (currentDepth < maxDepth) {
        await enqueueLinks({
          globs: [`${startOrigin}/**`],
          transformRequestFunction: (req) => {
            req.userData = { depth: currentDepth + 1 };
            return req;
          },
        });
      }
    },

    failedRequestHandler({ request, error }) {
      console.error(`Failed to crawl: ${request.url}`, error?.message);
    },
  }, crawlConfig);

  await crawler.run([{
    url,
    userData: { depth: 0 },
  }]);

  try {
    const { rm } = await import('fs/promises');
    await rm(`/tmp/crawlee-${crawlId}`, { recursive: true, force: true });
  } catch { /* ignore cleanup errors */ }

  return pages;
}
