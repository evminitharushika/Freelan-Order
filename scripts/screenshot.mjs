#!/usr/bin/env node
/**
 * Visual check: captures pages at desktop and mobile widths into ./screenshots.
 *   npm run dev            (in another terminal)
 *   node scripts/screenshot.mjs [baseUrl] [route ...]
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const base = process.argv[2] ?? 'http://localhost:5173';
const routes = process.argv.slice(3);
const targets = routes.length ? routes : ['/'];
mkdirSync('screenshots', { recursive: true });

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900, isMobile: false },
  { name: 'mobile', width: 390, height: 844, isMobile: true },
];

const browser = await chromium.launch();
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: 1, isMobile: vp.isMobile, hasTouch: vp.isMobile });
  await ctx.addInitScript(() => {
    localStorage.setItem('freelan:intro-seen', 'true');
    const extra = new URLSearchParams(location.search).get('seed');
    if (extra) for (const [k, v] of Object.entries(JSON.parse(extra))) localStorage.setItem(k, v);
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error(`[${vp.name}] pageerror:`, e.message));
  page.on('console', (m) => m.type() === 'error' && console.error(`[${vp.name}] console:`, m.text()));
  for (const route of targets) {
    const slug = route.replace(/[^a-z0-9]+/gi, '_').replace(/^_|_$/g, '') || 'home';
    await page.goto(base + route, { waitUntil: 'networkidle' });
    await page.waitForTimeout(2200);
    await page.screenshot({ path: `screenshots/${slug}-${vp.name}-0.png` });
    if (route === '/') {
      const height = await page.evaluate(() => document.documentElement.scrollHeight);
      const stops = vp.isMobile ? [1, 2.2, 4.5, 9, 12.5] : [1.05, 2.5, 4.2, 7.5];
      for (const [i, s] of stops.entries()) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.round(vp.height * s));
        await page.waitForTimeout(1600);
        await page.screenshot({ path: `screenshots/${slug}-${vp.name}-${i + 1}.png` });
      }
      await page.evaluate((h) => window.scrollTo(0, h), height);
      await page.waitForTimeout(1500);
      await page.screenshot({ path: `screenshots/${slug}-${vp.name}-end.png` });
    } else {
      await page.screenshot({ path: `screenshots/${slug}-${vp.name}-full.png`, fullPage: true });
    }
  }
  await ctx.close();
}
await browser.close();
console.log('Screenshots written to ./screenshots');
