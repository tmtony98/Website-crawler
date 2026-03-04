/**
 * Smart Flow Extraction — The Core Intelligence
 *
 * This is the most important module in the project. It transforms raw crawl data
 * (a messy link graph) into a clean, meaningful user flow diagram.
 *
 * THE PROBLEM:
 * A raw crawl of a website gives you something like:
 *   Home → About, Products, Contact, Login, Cart  (every page has these)
 *   About → Home, Products, Contact, Login, Cart, Team
 *   Products → Home, About, Contact, Login, Cart, Shoes, Shirts
 *   Shoes → Home, About, Contact, Login, Cart, Size Guide
 *
 * Drawing ALL these connections gives you a messy hairball — unusable.
 *
 * THE SOLUTION:
 * We use heuristics (smart rules) to separate:
 *   SIGNAL: Home → Products → Shoes → Cart → Checkout  (actual user journey)
 *   NOISE:  Home, About, Contact, Login appear on EVERY page (global navigation)
 *
 * HEURISTICS USED:
 * 1. Frequency analysis — links appearing on 70%+ of pages = global nav
 * 2. Semantic location — links in <nav>/<header>/<footer> = likely global nav
 * 3. URL pattern grouping — /products/shoes + /products/shirts = /products/:slug
 * 4. Edge deduplication — after grouping, remove duplicate connections
 */

import { getPathname, groupUrlPatterns, detectPageType } from './urlUtils.js';

/**
 * Extract a clean user flow from raw crawl data.
 *
 * @param {Array} crawlData - Array of { url, title, links[], depth } from crawler
 * @returns {Object} { nodes, edges, globalNav, stats }
 */
export function extractFlow(crawlData) {
  if (!crawlData || crawlData.length === 0) {
    return { nodes: [], edges: [], globalNav: [], stats: {} };
  }

  const baseUrl = crawlData[0].url;
  const totalPages = crawlData.length;

  // ─── STEP 1: Count link frequency across all pages ───
  // If a link appears on most pages, it's probably global navigation (navbar/footer).
  // Think: "Home", "About", "Contact" links that appear literally everywhere.
  const linkFrequency = {};
  for (const page of crawlData) {
    // Use a Set to count each link only once per page
    const uniqueHrefs = new Set(page.links.map(l => getPathname(l.href)));
    for (const href of uniqueHrefs) {
      linkFrequency[href] = (linkFrequency[href] || 0) + 1;
    }
  }

  // ─── STEP 2: Classify links as global nav or content ───
  // Threshold: if a link appears on 70% or more of pages → global nav
  const GLOBAL_NAV_THRESHOLD = 0.7;
  const globalNavPaths = new Set();

  for (const [path, count] of Object.entries(linkFrequency)) {
    const frequency = count / totalPages;
    if (frequency >= GLOBAL_NAV_THRESHOLD) {
      globalNavPaths.add(path);
    }
  }

  // ─── STEP 3: Also classify by semantic HTML location ───
  // Links living inside <nav>, <header>, <footer> get extra "nav score".
  // Even if they don't appear on 70% of pages, their location suggests navigation.
  const linkLocationScores = {};
  for (const page of crawlData) {
    for (const link of page.links) {
      const path = getPathname(link.href);
      if (!linkLocationScores[path]) {
        linkLocationScores[path] = { nav: 0, content: 0 };
      }
      // Count how often this link appears in nav vs content areas
      if (['nav', 'header', 'footer'].includes(link.location)) {
        linkLocationScores[path].nav++;
      } else {
        linkLocationScores[path].content++;
      }
    }
  }

  // If a link appears in nav/header/footer more than 60% of the time, it's nav
  for (const [path, scores] of Object.entries(linkLocationScores)) {
    const total = scores.nav + scores.content;
    if (total > 0 && scores.nav / total > 0.6) {
      globalNavPaths.add(path);
    }
  }

  // ─── STEP 4: Group similar URLs into patterns ───
  // /products/shoes, /products/shirts, /products/hats → /products/:slug
  // This reduces 50 product nodes into 1 clean "Product Detail" node
  const allPaths = crawlData.map(page => getPathname(page.url));
  const patterns = groupUrlPatterns(allPaths);

  // ─── STEP 5: Build nodes ───
  // Each unique page (or pattern group) becomes a node in the diagram
  const nodeMap = {};
  const patternCounts = {}; // Track how many pages each pattern represents

  for (const page of crawlData) {
    const path = getPathname(page.url);
    const patternPath = patterns[path] || path;

    // Count pages per pattern
    patternCounts[patternPath] = (patternCounts[patternPath] || 0) + 1;

    if (!nodeMap[patternPath]) {
      const isPattern = patternPath.includes(':slug');
      nodeMap[patternPath] = {
        id: patternPath,
        label: isPattern ? generatePatternLabel(patternPath) : (page.title || patternPath),
        type: 'page', // Will be updated after we know child counts
        url: isPattern ? patternPath : page.url,
        isPattern,
        count: 0,
        depth: page.depth,
      };
    }
  }

  // Update counts and types
  for (const [patternPath, count] of Object.entries(patternCounts)) {
    if (nodeMap[patternPath]) {
      nodeMap[patternPath].count = count;
    }
  }

  // Determine which patterns have children (are "listing" pages)
  const parentPaths = new Set(Object.keys(patterns).map(p => {
    const segments = p.split('/').filter(Boolean);
    return '/' + segments.slice(0, -1).join('/');
  }));

  for (const [path, node] of Object.entries(nodeMap)) {
    node.type = detectPageType(path, node.isPattern, parentPaths.has(path) ? 1 : 0);
  }

  // ─── STEP 6: Build edges (connections between pages) ───
  // Only include edges for CONTENT links, not global navigation.
  // This is the key noise reduction step.
  const edgeSet = new Set(); // Deduplicate edges
  const edges = [];

  for (const page of crawlData) {
    const sourcePath = patterns[getPathname(page.url)] || getPathname(page.url);

    for (const link of page.links) {
      const targetPath = patterns[getPathname(link.href)] || getPathname(link.href);

      // Skip self-links
      if (sourcePath === targetPath) continue;

      // Skip links classified as global navigation
      if (globalNavPaths.has(getPathname(link.href))) continue;

      // Skip if the target isn't a page we actually crawled (or a pattern we found)
      if (!nodeMap[targetPath]) continue;

      // Deduplicate: only one edge per source→target pair
      const edgeKey = `${sourcePath}->${targetPath}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);

      edges.push({
        id: edgeKey,
        source: sourcePath,
        target: targetPath,
        label: link.text || '',
      });
    }
  }

  // ─── STEP 7: Build global nav list for the sidebar ───
  const globalNav = [];
  const seenNavLinks = new Set();
  for (const page of crawlData) {
    for (const link of page.links) {
      const path = getPathname(link.href);
      if (globalNavPaths.has(path) && !seenNavLinks.has(path)) {
        seenNavLinks.add(path);
        const freq = linkFrequency[path] || 0;
        globalNav.push({
          text: link.text || path,
          href: path,
          appearsOnPercent: Math.round((freq / totalPages) * 100),
        });
      }
    }
  }

  // Sort global nav by frequency (most common first)
  globalNav.sort((a, b) => b.appearsOnPercent - a.appearsOnPercent);

  // Convert nodeMap to array
  const nodes = Object.values(nodeMap);

  return {
    nodes,
    edges,
    globalNav,
    stats: {
      totalPagesVisited: totalPages,
      totalNodes: nodes.length,
      totalEdges: edges.length,
      globalNavLinksFiltered: globalNav.length,
      patternsDetected: Object.keys(patternCounts).filter(p => p.includes(':slug')).length,
    },
  };
}

/**
 * Generate a human-readable label for a URL pattern.
 * "/products/:slug" → "Product Detail"
 * "/blog/:slug" → "Blog Post"
 */
function generatePatternLabel(patternPath) {
  const segments = patternPath.split('/').filter(Boolean);
  // Get the parent segment name
  const parent = segments[segments.length - 2] || 'Page';
  // Singularize and capitalize (simple heuristic)
  let label = parent.charAt(0).toUpperCase() + parent.slice(1);
  if (label.endsWith('s') && label.length > 3) {
    label = label.slice(0, -1); // "Products" → "Product"
  }
  return `${label} Detail`;
}
