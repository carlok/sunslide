#!/usr/bin/env node
/** Screenshot ecology floor cells after popping bubbles (built preview). */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outFile = process.env.ECOLOGY_CAPTURE_OUT
  ? path.resolve(process.env.ECOLOGY_CAPTURE_OUT)
  : path.join(root, 'tests', 'out', 'ecology-floor.png');
mkdirSync(path.dirname(outFile), { recursive: true });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

const host = process.env.PREVIEW_HOST || 'localhost';
const port = Number(process.env.PREVIEW_PORT) || 4176;
const baseUrl = `http://${host}:${port}/sunslide/`;

const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'],
  { cwd: root, stdio: 'ignore', env: { ...process.env, BROWSER: 'none' } },
);

for (let i = 0; i < 120; i++) {
  try {
    if ((await fetch(baseUrl)).ok) break;
  } catch {
    await new Promise((r) => setTimeout(r, 250));
  }
}

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(baseUrl, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__sunslide?.setCamPose, null, { timeout: 30000 });
if (await page.locator('#tutorialSkip').isVisible().catch(() => false)) await page.click('#tutorialSkip');

await page.click('#go');
await page.evaluate(() => window.__sunslide.setQuality(2));

const pops = [
  [0, 3, 2],
  [0, 4, 2],
  [0, 3, 1],
  [1, 2, 1],
  [1, 5, 2],
  [2, 1, 3],
  [3, 6, 1],
  [4, 2, 2],
];
for (const [t, x, y] of pops) {
  await page.evaluate(
    ([ti, xi, yi]) => window.__sunslide.popBubbleAt(ti, xi, yi),
    [t, x, y],
  );
}
for (let i = 0; i < 80; i++) await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);

const player = await page.evaluate(() => window.__sunslide.player);
const camLon =
  Number(process.env.ECOLOGY_CAPTURE_CAM_LON) ||
  (player?.t != null ? Math.atan2(1, 1) : 0.8);
await page.evaluate(
  (p) => {
    window.__sunslide.setView(false);
    window.__sunslide.setCamPose({
      state: 'play',
      zoomT: 0,
      zoomTarget: 0,
      viewFar: false,
      camLon: p.camLon,
      camLat: 0.12,
    });
  },
  { camLon },
);
for (let i = 0; i < 60; i++) await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);

await page.screenshot({ path: outFile });
console.log('Wrote', path.relative(root, outFile));
await browser.close();
preview.kill('SIGTERM');