# FlowMapper — Intelligent User Flow Mapper

FlowMapper crawls a website and automatically extracts meaningful user navigation flows, filtering out global navigation noise to reveal how users actually move through a site.

## How to Run

```bash
# Install dependencies
npm install

# Start both client and server (concurrent)
npm run dev
```

- **Client**: http://localhost:5173 (Vite + React)
- **Server**: http://localhost:3001 (Express + SSE)

## Architecture

```
client/               React frontend (Vite)
  src/
    components/
      CrawlForm.jsx     URL input, auth fields, crawl settings
      FlowDiagram.jsx   React Flow canvas with dagre auto-layout
      PageNode.jsx       Custom node component (color-coded by page type)
      ProgressBar.jsx    Real-time crawl progress
    utils/api.js        SSE client for server communication
    App.jsx             Sidebar + content area layout

server/               Express backend
  src/
    index.js            Express server with SSE endpoint
    crawler.js          Crawlee + Playwright website crawler
    flowExtractor.js    Core intelligence — noise reduction & flow extraction
    urlUtils.js         URL normalization, pattern grouping, page type detection
```

## How It Works

1. **Crawl**: Uses Crawlee + Playwright to visit pages, collecting every link and its semantic DOM location (`<nav>`, `<main>`, `<footer>`, etc.)
2. **Extract**: Applies noise reduction heuristics (see below) to separate signal from noise
3. **Visualize**: Renders clean left-to-right flow chains using React Flow + dagre layout

## Noise Reduction Heuristics

The core challenge is turning a messy link graph into a clean user flow. Raw crawl data produces a "hairball" because every page links to every other page via navbar/footer. We use four heuristics to filter noise:

### 1. Frequency Analysis (70% threshold)
Links appearing on 70% or more of crawled pages are classified as global navigation. These are typically navbar and footer links (Home, About, Contact) that exist on every page but don't represent meaningful user journeys. See `flowExtractor.js` — `GLOBAL_NAV_THRESHOLD = 0.7`.

### 2. Semantic Location Detection
Each link's position in the DOM hierarchy is tracked during crawling. Links inside `<nav>`, `<header>`, or `<footer>` elements (or elements with corresponding ARIA roles/CSS classes) are weighted as navigation. If a link appears in nav/header/footer locations more than 60% of the time, it's classified as global nav — even if it doesn't meet the frequency threshold. See `crawler.js` link extraction and `flowExtractor.js` Step 3.

### 3. URL Pattern Grouping
Similar URLs are grouped into patterns: `/products/shoes`, `/products/shirts`, `/products/hats` all become `/products/:slug` ("Product Detail"). This collapses dozens of similar pages into a single representative node, making the flow readable. See `urlUtils.js` — `groupUrlPatterns()`.

### 4. Edge Deduplication
After pattern grouping, many source→target pairs become duplicates. We deduplicate edges so each connection appears only once, keeping the diagram clean. See `flowExtractor.js` Step 6 — `edgeSet`.

These heuristics combine to transform a raw graph of 50+ interconnected pages into a clean flow of 5-10 meaningful nodes showing actual user journeys.
