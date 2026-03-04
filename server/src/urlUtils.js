/**
 * URL normalization and pattern grouping utilities.
 *
 * Why this exists:
 * When crawling, the same page can appear as multiple URLs:
 *   /products/  vs  /products  vs  /products?ref=nav  vs  /products#section
 * We normalize all of these to a single canonical form to avoid duplicates.
 *
 * We also group similar URLs into patterns:
 *   /products/shoes, /products/shirts → /products/:slug
 * This dramatically reduces the number of nodes in the flow diagram.
 */

/**
 * Normalize a URL to a canonical form.
 * Strips trailing slashes, query params, and hash fragments.
 */
export function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString);
    // Remove hash and query params — they're usually not separate pages
    let pathname = url.pathname;
    // Remove trailing slash (but keep "/" for root)
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${url.origin}${pathname}`;
  } catch {
    return urlString;
  }
}

/**
 * Get just the pathname from a full URL.
 * "/products/shoes" from "https://example.com/products/shoes"
 */
export function getPathname(urlString) {
  try {
    const url = new URL(urlString);
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return pathname;
  } catch {
    return urlString;
  }
}

/**
 * Check if a URL belongs to the same domain as the base URL.
 * We only crawl internal links — no wandering off to external sites.
 */
export function isSameDomain(urlString, baseUrl) {
  try {
    const url = new URL(urlString);
    const base = new URL(baseUrl);
    return url.hostname === base.hostname;
  } catch {
    return false;
  }
}

/**
 * Group similar URLs into patterns.
 *
 * How it works:
 * 1. Take all crawled paths: ["/products/shoes", "/products/shirts", "/products/hats"]
 * 2. Split each into segments: ["products", "shoes"], ["products", "shirts"], etc.
 * 3. For paths with the same prefix and depth, if there are 2+ unique last segments,
 *    replace the last segment with ":slug" → "/products/:slug"
 *
 * This turns 50 product pages into 1 node on the diagram.
 */
export function groupUrlPatterns(paths) {
  // Group paths by their "parent" path (everything except last segment)
  const groups = {};

  for (const path of paths) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) {
      // Root-level paths like "/about" don't get grouped
      continue;
    }
    const parent = '/' + segments.slice(0, -1).join('/');
    const lastSegment = segments[segments.length - 1];

    if (!groups[parent]) {
      groups[parent] = new Set();
    }
    groups[parent].add(lastSegment);
  }

  // Patterns: if a parent has 2+ children, it's a pattern
  const patterns = {}; // path → pattern (e.g., "/products/shoes" → "/products/:slug")

  for (const [parent, children] of Object.entries(groups)) {
    if (children.size >= 2) {
      // This parent has multiple children → create a pattern
      const patternPath = `${parent}/:slug`;
      for (const child of children) {
        const fullPath = `${parent}/${child}`;
        patterns[fullPath] = patternPath;
      }
    }
  }

  return patterns;
}

/**
 * Detect the "type" of a page based on its URL pattern.
 * This is used for color-coding nodes in the flow diagram.
 */
export function detectPageType(pathname, isPattern = false, childCount = 0) {
  if (pathname === '/') return 'home';
  if (isPattern) return 'detail';
  if (childCount > 0) return 'listing';

  const lower = pathname.toLowerCase();
  if (lower.includes('login') || lower.includes('signin') || lower.includes('auth')) return 'auth';
  if (lower.includes('cart') || lower.includes('basket')) return 'cart';
  if (lower.includes('checkout') || lower.includes('payment')) return 'checkout';
  if (lower.includes('search') || lower.includes('find')) return 'search';
  if (lower.includes('contact') || lower.includes('support')) return 'support';
  if (lower.includes('about') || lower.includes('team')) return 'info';

  return 'page';
}
