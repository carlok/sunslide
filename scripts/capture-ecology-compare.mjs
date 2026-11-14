#!/usr/bin/env node
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const label = process.argv[2] || 'shot';
const outDir = process.argv[3] || '/opt/cursor/artifacts/ecology-pr';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
mkdirSync(outDir, { recursive: true });
const PORT = 4181;
const preview = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'], {
  cwd: root, stdio: 'ignore', detached: true, env: { ...process.env, BROWSER: 'none' },
});
preview.unref();
const baseUrl = `http://127.0.0.1:${PORT}/sunslide/`;
for (let i = 0; i < 80; i++) {
  try {
    if ((await fetch(baseUrl)).ok) break;
  } catch {
    /* */
  }
  await new Promise((r) => setTimeout(r, 250));
}
const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});
for (const [name, w, h, dpr] of [
  ['desktop', 1280, 800, 1],
  ['mobile', 390, 780, 2],
]) {
  const page = await browser.newPage({
    viewport: { width: w, height: h },
    deviceScaleFactor: dpr,
  });
  await page.goto(baseUrl);
  await page.waitForFunction(() => !!window.__sunslide);
  await page.evaluate(() => window.__sunslide.setQuality(name === 'desktop' ? 2 : 1));
  await page.click('#go', { noWaitAfter: true });
  await page.waitForTimeout(500);
  await page.evaluate(({ pop }) => {
    const S = window.__sunslide;
    S.inv = 1e9;
    if (pop && S.popBubbleAt) {
      let n = 0;
      for (const T of S.tiles) {
        for (let i = 0; i < 32; i++) {
          if (T.dots[i] === 1 && n < 4) {
            S.popBubbleAt(T.id, i % 8, (i / 8) | 0);
            n++;
          }
        }
      }
    }
    for (let i = 0; i < 90; i++) S.update(0.03);
  }, { pop: label !== 'before' });
  const box = await page.locator('#stage').boundingBox();
  await page.screenshot({
    path: path.join(outDir, `${label}-${name}.png`),
    clip: box,
    animations: 'disabled',
  });
  await page.close();
}
await browser.close();
try {
  process.kill(-preview.pid, 'SIGKILL');
} catch {
  /* */
}
console.log('wrote', outDir, label);