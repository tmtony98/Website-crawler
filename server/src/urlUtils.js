export function normalizeUrl(urlString) {
  try {
    const url = new URL(urlString);
    let pathname = url.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    return `${url.origin}${pathname}`;
  } catch {
    return urlString;
  }
}

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

export function isSameDomain(urlString, baseUrl) {
  try {
    const url = new URL(urlString);
    const base = new URL(baseUrl);
    return url.hostname === base.hostname;
  } catch {
    return false;
  }
}

// Groups URLs with shared prefixes into patterns (e.g. /products/shoes + /products/shirts → /products/:slug)
export function groupUrlPatterns(paths) {
  const groups = {};

  for (const path of paths) {
    const segments = path.split('/').filter(Boolean);
    if (segments.length < 2) continue;

    const parent = '/' + segments.slice(0, -1).join('/');
    const lastSegment = segments[segments.length - 1];

    if (!groups[parent]) {
      groups[parent] = new Set();
    }
    groups[parent].add(lastSegment);
  }

  const patterns = {};

  for (const [parent, children] of Object.entries(groups)) {
    if (children.size >= 2) {
      const patternPath = `${parent}/:slug`;
      for (const child of children) {
        const fullPath = `${parent}/${child}`;
        patterns[fullPath] = patternPath;
      }
    }
  }

  return patterns;
}

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
