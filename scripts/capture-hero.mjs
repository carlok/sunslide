#!/usr/bin/env node
/** Capture framed hero + gameplay shots from the production build. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, copyFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const assets = path.join(root, 'assets');
const docs = path.join(root, 'docs');
mkdirSync(assets, { recursive: true });
mkdirSync(docs, { recursive: true });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

const PORT = Number(process.env.HERO_PORT) || 4174;
const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: 'ignore', env: { ...process.env, BROWSER: 'none' } },
);

const baseUrl = `http://127.0.0.1:${PORT}/sunslide/`;
for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(baseUrl)).ok) break;
  } catch {
    /* wait */
  }
  await new Promise((r) => setTimeout(r, 250));
}

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__sunslide, null, { timeout: 30000 });
await page.evaluate(() => window.__sunslide.setQuality(2));
await page.click('#go');
await page.waitForTimeout(1500);
await page.evaluate(() => {
  const S = window.__sunslide;
  S.inv = 1e9;
  for (let i = 0; i < 500; i++) {
    S.want = i % 4;
    if (i % 40 === 0) S.trySlide(1, 0);
    S.update(0.03);
  }
});

await page.evaluate(() => {
  const t = document.createElement('div');
  t.id = 'hero-caption';
  t.innerHTML =
    '<div style="font:800 52px system-ui;letter-spacing:.14em;color:#ffd25e;text-shadow:0 0 22px rgba(255,170,60,.55)">SUNSLIDE</div>' +
    '<div style="font:15px system-ui;color:#c8cff0;margin-top:6px">Bubble frog · sliding islands · tiny planet</div>';
  t.style.cssText =
    'position:fixed;top:calc(env(safe-area-inset-top) + 8px);left:0;right:0;text-align:center;z-index:20;pointer-events:none';
  document.body.appendChild(t);
});
await page.waitForTimeout(500);

const gameplayPath = path.join(assets, 'gameplay-desktop.png');
const heroPath = path.join(assets, 'hero.png');
await page.screenshot({ path: gameplayPath });
await page.screenshot({
  path: heroPath,
  clip: { x: 0, y: 0, width: 1280, height: 670 },
});
copyFileSync(gameplayPath, path.join(docs, 'hero-gameplay.png'));
copyFileSync(heroPath, path.join(docs, 'hero.png'));

await browser.close();
preview.kill('SIGTERM');
console.log('Wrote', heroPath);