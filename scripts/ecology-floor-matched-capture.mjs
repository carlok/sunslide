#!/usr/bin/env node
/**
 * Matched ecology captures: fixed seed, same tile/pops/camera; day + night lighting.
 * ECOLOGY_LABEL=before-day|before-night|after-day|after-night
 * Requires npm run build first.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const label = process.env.ECOLOGY_LABEL || 'after-day';
const lighting = label.endsWith('night') ? 'night' : 'day';
const outDir = path.resolve(process.env.ECOLOGY_CAPTURE_DIR || '/opt/cursor/artifacts');
const stem = `ecology-floor-${label}`;
const outFull = path.join(outDir, `${stem}.png`);
const outCrop = path.join(outDir, `${stem}-crop.png`);
mkdirSync(outDir, { recursive: true });

const CAPTURE_SEED = Number(process.env.ECOLOGY_CAPTURE_SEED || 31415);

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

const CROP_FRAC = { x: 0.22, y: 0.38, w: 0.5, h: 0.42 };

const host = process.env.PREVIEW_HOST || '127.0.0.1';
const port = Number(process.env.PREVIEW_PORT) || 4176;
const baseUrl = `http://${host}:${port}/sunslide/`;

// A leftover server on the port would silently serve another build (e.g. "after" for a "before" shot).
if (await fetch(baseUrl).then(() => true, () => false)) {
  console.error(`Port ${port} is already serving; stop that server or set PREVIEW_PORT`);
  process.exit(1);
}

const preview = spawn(
  process.execPath,
  [path.join(root, 'node_modules', 'vite', 'bin', 'vite.js'), 'preview', '--host', host, '--port', String(port), '--strictPort'],
  { cwd: root, stdio: 'ignore', detached: true, env: { ...process.env, BROWSER: 'none' } },
);
const stopPreview = () => {
  try {
    process.kill(-preview.pid, 'SIGTERM');
  } catch {
    /* already gone */
  }
};
process.on('exit', stopPreview);

let served = '';
for (let i = 0; i < 120; i++) {
  try {
    const res = await fetch(baseUrl);
    if (res.ok) {
      served = await res.text();
      break;
    }
  } catch {
    /* wait */
  }
  await new Promise((r) => setTimeout(r, 250));
}
if (served !== readFileSync(path.join(root, 'dist', 'index.html'), 'utf8')) {
  console.error(`Server on port ${port} is not serving ${path.join(root, 'dist')}`);
  process.exit(1);
}

const browser = await chromium.launch({
  args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
});

const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.addInitScript(() => {
  try {
    localStorage.setItem('sunslide.tutorialSeen', JSON.stringify(true));
  } catch {
    /* private mode */
  }
});
await page.goto(baseUrl, { waitUntil: 'networkidle' });
await page.waitForFunction(() => !!window.__sunslide?.setEcologyCaptureView, null, { timeout: 30000 });

await page.evaluate((seed) => {
  const S = window.__sunslide;
  if (typeof S.beginDeterministicRun === 'function') {
    S.beginDeterministicRun(seed);
    return;
  }
  let a = seed >>> 0;
  const rng = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const orig = Math.random;
  Math.random = rng;
  try {
    S.startGame();
  } finally {
    Math.random = orig;
  }
  S.inv = 1e9;
  for (let i = 0; i < 90; i++) S.update(1 / 60);
}, CAPTURE_SEED);

await page.evaluate(() => window.__sunslide.setQuality(2));
await page.evaluate(() => {
  window.__sunslide.inv = 1e9;
});

if (await page.locator('#tutorialSkip').isVisible().catch(() => false)) {
  await page.click('#tutorialSkip');
}

const focusTile = await page.evaluate(() => {
  const S = window.__sunslide;
  let best = 0;
  let bestScore = -1;
  for (let tid = 0; tid < S.tiles.length; tid++) {
    const T = S.tiles[tid];
    // Slot row 1 spans the subsolar latitude, so the day shot has the sun nearly overhead.
    if (T.slot?.r !== 1) continue;
    let bubbles = 0;
    for (let i = 0; i < 32; i++) if (T.dots[i] === 1) bubbles++;
    if (bubbles > bestScore) {
      bestScore = bubbles;
      best = tid;
    }
  }
  return best;
});

const pops = await page.evaluate((tid) => {
  const T = window.__sunslide.tiles[tid];
  const out = [];
  for (let i = 0; i < 32; i++) if (T.dots[i] === 1) out.push([tid, i % 8, (i / 8) | 0]);
  // Clearing the island triggers its own floor bloom, which would hide the patches being compared.
  if (out.length && !T.dots.some((v) => v > 1)) out.pop();
  return out;
}, focusTile);

for (const pop of pops) {
  await page.evaluate(([t, x, y]) => window.__sunslide.popBubbleAt(t, x, y), pop);
}

for (let i = 0; i < 200; i++) {
  await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);
}

const viewMeta = await page.evaluate(
  ([tid, lit]) => window.__sunslide.setEcologyCaptureView(tid, lit),
  [focusTile, lighting],
);

for (let i = 0; i < 12; i++) {
  await page.evaluate(() => window.__sunslide.drawCaptureFrame());
}

const metrics = await page.evaluate((tid) => ({
  greened: window.__sunslide.greenedCount,
  pose: window.__sunslide.getCamPose?.(),
  tileLight: window.__sunslide.tileLightAt?.(tid),
}), focusTile);

const stage = await page.locator('#stage').boundingBox();
if (!stage) throw new Error('stage missing');
const crop = {
  x: stage.x + stage.width * CROP_FRAC.x,
  y: stage.y + stage.height * CROP_FRAC.y,
  width: stage.width * CROP_FRAC.w,
  height: stage.height * CROP_FRAC.h,
};

await page.screenshot({ path: outFull, clip: stage, animations: 'disabled' });
await page.screenshot({ path: outCrop, clip: crop, animations: 'disabled' });
await page.evaluate(() => window.__sunslide.releaseEcologyCaptureView?.());

console.log(
  JSON.stringify({
    label,
    lighting,
    seed: CAPTURE_SEED,
    outFull,
    outCrop,
    greened: metrics.greened,
    focusTile,
    pops: pops.length,
    viewMeta,
    tileLight: viewMeta?.tileLight,
  }),
);

await browser.close();
stopPreview();