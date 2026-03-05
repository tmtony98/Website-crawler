import { getPathname, groupUrlPatterns, detectPageType } from './urlUtils.js';

export function extractFlow(crawlData) {
  if (!crawlData || crawlData.length === 0) {
    return { nodes: [], edges: [], globalNav: [], stats: {} };
  }

  const baseUrl = crawlData[0].url;
  const totalPages = crawlData.length;

  const linkFrequency = {};
  for (const page of crawlData) {
    const uniqueHrefs = new Set(page.links.map(l => getPathname(l.href)));
    for (const href of uniqueHrefs) {
      linkFrequency[href] = (linkFrequency[href] || 0) + 1;
    }
  }

  // Links on 70%+ of pages are global nav (navbar/footer)
  const GLOBAL_NAV_THRESHOLD = 0.7;
  const globalNavPaths = new Set();

  for (const [path, count] of Object.entries(linkFrequency)) {
    const frequency = count / totalPages;
    if (frequency >= GLOBAL_NAV_THRESHOLD) {
      globalNavPaths.add(path);
    }
  }

  // Also classify by semantic HTML location
  const linkLocationScores = {};
  for (const page of crawlData) {
    for (const link of page.links) {
      const path = getPathname(link.href);
      if (!linkLocationScores[path]) {
        linkLocationScores[path] = { nav: 0, content: 0 };
      }
      if (['nav', 'header', 'footer'].includes(link.location)) {
        linkLocationScores[path].nav++;
      } else {
        linkLocationScores[path].content++;
      }
    }
  }

  for (const [path, scores] of Object.entries(linkLocationScores)) {
    const total = scores.nav + scores.content;
    if (total > 0 && scores.nav / total > 0.6) {
      globalNavPaths.add(path);
    }
  }

  const allPaths = crawlData.map(page => getPathname(page.url));
  const patterns = groupUrlPatterns(allPaths);

  const nodeMap = {};
  const patternCounts = {};
  const patternPages = {};

  for (const page of crawlData) {
    const path = getPathname(page.url);
    const patternPath = patterns[path] || path;

    patternCounts[patternPath] = (patternCounts[patternPath] || 0) + 1;

    if (!patternPages[patternPath]) patternPages[patternPath] = [];
    patternPages[patternPath].push({ url: page.url, title: page.title, path });

    if (!nodeMap[patternPath]) {
      const isPattern = patternPath.includes(':slug');
      nodeMap[patternPath] = {
        id: patternPath,
        label: isPattern ? generatePatternLabel(patternPath) : (page.title || patternPath),
        type: 'page',
        url: isPattern ? patternPath : page.url,
        isPattern,
        count: 0,
        pages: [],
        depth: page.depth,
      };
    }
  }

  for (const [patternPath, count] of Object.entries(patternCounts)) {
    if (nodeMap[patternPath]) {
      nodeMap[patternPath].count = count;
      nodeMap[patternPath].pages = patternPages[patternPath] || [];
    }
  }

  const parentPaths = new Set(Object.keys(patterns).map(p => {
    const segments = p.split('/').filter(Boolean);
    return '/' + segments.slice(0, -1).join('/');
  }));

  for (const [path, node] of Object.entries(nodeMap)) {
    node.type = detectPageType(path, node.isPattern, parentPaths.has(path) ? 1 : 0);
  }

  // Only include content links, not global nav — this is the key noise reduction
  const edgeSet = new Set();
  const edges = [];

  for (const page of crawlData) {
    const sourcePath = patterns[getPathname(page.url)] || getPathname(page.url);

    for (const link of page.links) {
      const targetPath = patterns[getPathname(link.href)] || getPathname(link.href);

      if (sourcePath === targetPath) continue;
      if (globalNavPaths.has(getPathname(link.href))) continue;
      if (!nodeMap[targetPath]) continue;

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

  globalNav.sort((a, b) => b.appearsOnPercent - a.appearsOnPercent);

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

function generatePatternLabel(patternPath) {
  const segments = patternPath.split('/').filter(Boolean);
  const parent = segments[segments.length - 2] || 'Page';
  let label = parent.charAt(0).toUpperCase() + parent.slice(1);
  if (label.endsWith('s') && label.length > 3) {
    label = label.slice(0, -1);
  }
  return `${label} Detail`;
}
