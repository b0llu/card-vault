#!/usr/bin/env node
/**
 * Export Play Store screenshot HTMLs to PNGs.
 * Run: node export-screenshots.js
 */
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const SS_DIR = path.join(ROOT, 'store-screenshots');

const DEVICES = [
  { folder: 'phone',         w: 1080, h: 1920 },
  { folder: 'tablet-7inch',  w: 1200, h: 2133 },
  { folder: 'tablet-10inch', w: 1620, h: 2880 },
];

(async () => {
  console.log('Launching browser…');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  let total = 0;

  for (const device of DEVICES) {
    const dir = path.join(SS_DIR, device.folder);
    const htmlFiles = fs.readdirSync(dir).filter(f => f.endsWith('.html')).sort();

    console.log(`\n[${device.folder}] — ${device.w}×${device.h}`);

    for (const file of htmlFiles) {
      const htmlPath = path.join(dir, file);
      const pngPath  = path.join(dir, file.replace('.html', '.png'));

      const page = await browser.newPage();
      await page.setViewport({ width: device.w, height: device.h, deviceScaleFactor: 1 });
      await page.goto(`file://${htmlPath}`, { waitUntil: 'networkidle0', timeout: 30000 });

      // Small wait for fonts / gradients to settle
      await new Promise(r => setTimeout(r, 800));

      await page.screenshot({
        path: pngPath,
        type: 'png',
        clip: { x: 0, y: 0, width: device.w, height: device.h },
      });
      await page.close();

      const kb = Math.round(fs.statSync(pngPath).size / 1024);
      console.log(`  ✓ ${file.replace('.html', '.png')}  (${kb} KB)`);
      total++;
    }
  }

  await browser.close();
  console.log(`\nDone! ${total} PNGs saved in store-screenshots/`);
})();
