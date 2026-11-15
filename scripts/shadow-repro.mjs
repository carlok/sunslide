#!/usr/bin/env node
/** Capture the grazing-sun / north-pole shadow view (Playwright + built preview). */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'tests', 'out');
const outFile =
  process.env.SHADOW_REPRO_OUT ||
  path.join(outDir, 'shadow-pole-graze.png');
mkdirSync(path.dirname(outFile), { recursive: true });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

const host = process.env.PREVIEW_HOST || 'localhost';
const port = Number(process.env.PREVIEW_PORT) || 4175;
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
    /* wait */
  }
  await new Promise((r) => setTimeout(r, 250));
}

const camLon = Number(process.env.SHADOW_REPRO_CAM_LON ?? 1.15);
const camLat = Number(process.env.SHADOW_REPRO_CAM_LAT ?? 0.36);
const sunLon = Number(process.env.SHADOW_REPRO_SUN_LON ?? camLon + 2.85);
const skyDay = Number(process.env.SHADOW_REPRO_SKY_DAY ?? 0.06);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(baseUrl, { waitUntil: 'load' });
await page.waitForFunction(() => !!window.__sunslide?.setCamPose, null, { timeout: 30000 });

for (let t = 0; t < 3; t++) {
  if (await page.locator('#tutorialSkip').isVisible().catch(() => false)) {
    await page.click('#tutorialSkip');
    await page.waitForTimeout(200);
  }
}

await page.evaluate(
  (p) => {
    window.__sunslide.goTitle();
    window.__sunslide.setQuality(2);
    window.__sunslide.setCamPose({
      state: 'title',
      zoomT: 1,
      zoomTarget: 1,
      viewFar: true,
      ...p,
    });
  },
  { camLon, camLat, sunLon, skyDay },
);

const settleFrames = Number(process.env.SHADOW_REPRO_SETTLE_FRAMES ?? 48);
for (let i = 0; i < settleFrames; i++) {
  await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);
}

await page.screenshot({ path: outFile });
await browser.close();
preview.kill('SIGTERM');
console.log('Wrote', path.relative(root, outFile));
console.log('Pose', { camLon, camLat, sunLon, skyDay });