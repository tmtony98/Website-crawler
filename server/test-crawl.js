import { PlaywrightCrawler, Configuration } from 'crawlee';

const config = Configuration.getGlobalConfig();
config.set('persistStorage', false);
config.set('purgeOnStart', true);

const crawler = new PlaywrightCrawler({
  maxRequestsPerCrawl: 3,
  requestHandlerTimeoutSecs: 30,
  launchContext: { launchOptions: { headless: true } },

  async requestHandler({ page, request }) {
    console.log('VISITING:', request.url);
    const title = await page.title();
    console.log('TITLE:', title);
  },

  failedRequestHandler({ request, error }) {
    console.error('FAILED:', request.url, error?.message);
  },
});

console.log('Starting crawl...');
await crawler.run([{ url: 'https://books.toscrape.com' }]);
console.log('Crawl done.');
