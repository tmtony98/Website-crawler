# Web Crawling — Complete Beginner Guide

## Why Does Crawling Exist?

Think about **Google Search**. How does Google know about billions of websites?

Someone didn't manually type every URL. Google has **crawlers** (called "Googlebots") that:
1. Start at known websites
2. Follow every link they find
3. Save the page content
4. Move to the next link
5. Repeat... forever

**That's crawling** — automated browsing at scale.

---

## Real World Uses of Crawling

| Use Case | Example |
|----------|---------|
| **Search Engines** | Google, Bing crawl the entire web to index pages |
| **Price Comparison** | Sites that compare Amazon vs Flipkart prices |
| **SEO Tools** | Tools like Ahrefs that analyze website structure |
| **Content Aggregation** | News aggregators pulling headlines from many sites |
| **Testing** | Checking if all links on your site work (no broken links) |
| **Our Project** | Mapping how users navigate through a website |

---

## How a Web Page Works (The Basics)

When you visit `https://example.com`, your browser:

```
1. Sends a request  →  "Hey server, give me this page"
2. Server responds   →  Sends back HTML code
3. Browser renders   →  Turns HTML into what you see
```

That HTML contains links:

```html
<html>
  <body>
    <nav>
      <a href="/about">About Us</a>
      <a href="/products">Products</a>
      <a href="/contact">Contact</a>
    </nav>
    <main>
      <a href="/products/shoes">Check out Shoes</a>
    </main>
  </body>
</html>
```

A crawler reads this HTML, finds all the `<a href="...">` tags, and says:
> "OK, there are 4 links here. Let me visit each one."

---

## The Crawling Process — Step by Step

```
QUEUE (to-do list):  [https://example.com]
VISITED (done list): []

─── Step 1 ───
Visit: https://example.com
Found links: /about, /products, /contact
Add to queue: /about, /products, /contact
Mark as visited: https://example.com

QUEUE:   [/about, /products, /contact]
VISITED: [https://example.com]

─── Step 2 ───
Visit: /about
Found links: /about/team, /about/history, /products
Add to queue: /about/team, /about/history
Skip /products (already in queue)
Mark as visited: /about

QUEUE:   [/products, /contact, /about/team, /about/history]
VISITED: [https://example.com, /about]

─── Step 3 ───
Visit: /products
Found links: /products/shoes, /products/shirts
... and so on

─── Stops when ───
Queue is empty (visited everything)
OR max depth reached (e.g., only go 3 levels deep)
```

---

## Two Types of Websites (Why It Matters)

### 1. Static Sites (Simple HTML)
```
You click a link → Browser loads a WHOLE NEW PAGE from server
URL changes: /home → /about → /contact
```
- Easy to crawl — just read the HTML
- Tools: **Cheerio**, simple HTTP requests

### 2. Single Page Apps / SPAs (React, Vue, Angular)
```
You click a link → JavaScript UPDATES the page without full reload
URL might change but the page doesn't fully reload
Content is loaded dynamically via JavaScript
```
- **Harder to crawl** — the HTML is mostly empty, JavaScript builds the page
- You need a **real browser** to run the JavaScript first
- Tools: **Playwright, Puppeteer** (headless browsers)

### What's a Headless Browser?
A browser (like Chrome) running **without the visible window**. It loads pages, runs JavaScript, clicks buttons — everything a normal browser does — but invisible and controlled by code.

```
Normal Chrome:     You see the window, you click things
Headless Chrome:   No window, your CODE clicks things
```

That's what Playwright does — it controls a headless browser.

---

## What's a Crawl Depth?

```
Depth 0:  https://example.com                    (start page)
           │
Depth 1:  ├── /about                             (1 click away)
           ├── /products
           ├── /contact
           │
Depth 2:  ├── /about/team                        (2 clicks away)
           ├── /about/history
           ├── /products/shoes
           ├── /products/shirts
           │
Depth 3:  ├── /products/shoes/nike-air-max        (3 clicks away)
           ├── /products/shoes/adidas-ultra
```

**Depth = how many clicks from the start page.**

Setting `maxDepth: 3` means: "Don't go deeper than 3 clicks from the homepage."

Without a depth limit, you could crawl forever (imagine an e-commerce site with millions of products).

---

## Common Problems in Crawling

### 1. Infinite Loops
```
Page A links to Page B
Page B links to Page A
→ A → B → A → B → A → B... forever
```
**Solution**: Keep a "visited" list, never revisit a page.

### 2. External Links
```
Your site links to facebook.com, twitter.com, youtube.com...
You don't want to crawl the entire internet
```
**Solution**: Only follow links on the **same domain**.

### 3. Duplicate URLs
```
https://example.com/products
https://example.com/products/
https://example.com/products?ref=nav
https://example.com/products#section1
```
These are all basically the **same page**.
**Solution**: Normalize URLs (strip trailing slashes, query params, hashes).

### 4. Dynamic Content (SPAs)
```html
<!-- What the server sends -->
<div id="root"></div>
<script src="app.js"></script>

<!-- After JavaScript runs, it becomes -->
<div id="root">
  <nav>...</nav>
  <a href="/products">Products</a>
</div>
```
A simple HTTP request only sees the empty `<div>`. You need Playwright to run the JavaScript first.

---

## For Our Project Specifically

We crawl NOT to index content (like Google), but to answer:

> **"When a user is on Page X, where can they go next?"**

```
Crawl Result:
  Page: /home        → links to /products, /about, /contact, /login
  Page: /products    → links to /products/shoes, /products/shirts, /cart
  Page: /products/shoes → links to /products/shoes/nike, /cart
  Page: /cart        → links to /checkout
  Page: /checkout    → links to /confirmation

Flow we extract:
  /home → /products → /products/shoes → /cart → /checkout → /confirmation

Noise we filter out:
  Every page has /home, /about, /contact in the navbar
  → These are "global nav", not meaningful user flow
  → We don't draw arrows for these
```

---

## Summary

| Concept | Simple Explanation |
|---------|--------------------|
| **Crawling** | Automated browsing — visit pages, follow links |
| **Queue** | To-do list of URLs to visit |
| **Visited Set** | Done list — don't revisit |
| **Depth** | How many clicks deep from start |
| **Headless Browser** | Invisible browser controlled by code |
| **SPA** | Sites built with React/Vue — need headless browser |
| **enqueueLinks()** | "Find all links on this page, add to to-do list" |
| **Noise** | Nav/footer links that appear everywhere |
| **User Flow** | The meaningful path a user takes through a site |
