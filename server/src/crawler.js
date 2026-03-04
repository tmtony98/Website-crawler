/**
 * Website Crawler using Crawlee + Playwright
 *
 * This module handles the actual crawling of websites.
 * For each page visited, it collects:
 * - The page URL and title
 * - All links found on the page
 * - WHERE each link lives in the HTML (nav, header, footer, main, etc.)
 *
 * The "where" part is crucial for our flow extraction heuristics:
 * Links in <nav>/<header>/<footer> are likely global navigation (noise).
 * Links in <main>/<article> are likely meaningful content navigation (signal).
 */

import { PlaywrightCrawler, Configuration } from 'crawlee';
import { normalizeUrl, isSameDomain } from './urlUtils.js';
import { randomUUID } from 'crypto';

/**
 * Crawl a website starting from the given URL.
 *
 * @param {Object} config
 * @param {string} config.url - The starting URL to crawl
 * @param {number} config.maxDepth - How many clicks deep to go (default 3)
 * @param {number} config.maxPages - Max number of pages to visit (default 50)
 * @param {function} config.onProgress - Callback for progress updates
 * @returns {Promise<Array>} Array of page data objects
 */
export async function crawlWebsite({ url, maxDepth = 3, maxPages = 50, onProgress }) {
  const pages = [];
  const visited = new Set();
  let pagesVisited = 0;

  // IMPORTANT: Each crawl needs its own Configuration with a unique storageDir.
  // Without this, Crawlee's global request queue remembers URLs from previous crawls
  // and skips them, resulting in empty results on the 2nd+ crawl.
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

    // Use headless Chromium
    launchContext: {
      launchOptions: {
        headless: true,
      },
    },

    async requestHandler({ page, request, enqueueLinks }) {
      const normalizedUrl = normalizeUrl(request.url);

      // Skip if already visited (handles edge cases with redirects)
      if (visited.has(normalizedUrl)) return;
      visited.add(normalizedUrl);

      // Double-check we're still on the same domain (safety net)
      if (!isSameDomain(request.url, url)) return;

      pagesVisited++;

      // Wait for the page to settle (important for SPAs)
      await page.waitForLoadState('domcontentloaded');

      const title = await page.title();

      // Report progress
      if (onProgress) {
        onProgress({
          type: 'progress',
          pagesVisited,
          maxPages,
          currentUrl: normalizedUrl,
          currentTitle: title,
        });
      }

      // Extract all links with their semantic location in the DOM.
      // This is the key data collection step — we need to know not just
      // WHAT links exist, but WHERE they appear on the page.
      const links = await page.evaluate(() => {
        const anchors = document.querySelectorAll('a[href]');
        const results = [];

        for (const anchor of anchors) {
          const href = anchor.href;
          const text = anchor.textContent.trim().slice(0, 100); // Cap text length

          if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
            continue;
          }

          // Walk up the DOM tree to find which semantic section this link is in.
          // This tells us: is this link in the nav? the footer? the main content?
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

            // Also check common CSS classes/roles for sites that don't use semantic HTML
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

      // Filter to only internal links and normalize them
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

      // Enqueue internal links for crawling — Crawlee handles dedup
      // We use globs to strictly limit crawling to the start URL's origin,
      // because 'same-domain' strategy can sometimes leak to other domains.
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

  // Start the crawl from the given URL
  await crawler.run([{
    url,
    userData: { depth: 0 },
  }]);

  // Clean up temp directory
  try {
    const { rm } = await import('fs/promises');
    await rm(`/tmp/crawlee-${crawlId}`, { recursive: true, force: true });
  } catch { /* ignore cleanup errors */ }

  return pages;
}
