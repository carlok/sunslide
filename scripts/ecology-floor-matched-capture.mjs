#!/usr/bin/env node
/**
 * Matched before/after ecology floor captures: fixed PRNG seed, same tile, camera, pops.
 * Requires `npm run build` first. Set ECOLOGY_LABEL=before|after for output names.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const label = process.env.ECOLOGY_LABEL || 'after';
const outDir = path.resolve(process.env.ECOLOGY_CAPTURE_DIR || '/opt/cursor/artifacts');
const outFull = path.join(outDir, `ecology-floor-${label}.png`);
const outCrop = path.join(outDir, `ecology-floor-${label}-crop.png`);
mkdirSync(outDir, { recursive: true });

const CAPTURE_SEED = Number(process.env.ECOLOGY_CAPTURE_SEED || 0xec0107ec);

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

/** Shared across main (flat) and organic (mottled) builds. */
const FOCUS_TILE = 0;

const CAM_POSE = {
  state: 'play',
  camLon: 0.72,
  camLat: 0.11,
  sunLon: 1.85,
  skyDay: 1,
  zoomT: 0,
  zoomTarget: 0,
  viewFar: false,
};

/** Close-up of the sunlit meadow band (1280×720 stage). */
const CROP_FRAC = { x: 0.18, y: 0.22, w: 0.52, h: 0.5 };

const host = process.env.PREVIEW_HOST || '127.0.0.1';
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
    /* wait */
  }
  await new Promise((r) => setTimeout(r, 250));
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
await page.waitForFunction(() => !!window.__sunslide?.setCamPose, null, { timeout: 30000 });

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

const layout = await page.evaluate((focusTile) => {
  const T = window.__sunslide.tiles[focusTile];
  if (!T) return null;
  let walls = 0;
  let open = 0;
  let bubbles = 0;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      const i = y * 8 + x;
      if (T.walls[i]) walls++;
      else open++;
      if (T.dots[i] === 1) bubbles++;
    }
  }
  return { tileId: focusTile, walls, open, bubbles };
}, FOCUS_TILE);

const pops = await page.evaluate((focusTile) => {
  const out = [];
  const T = window.__sunslide.tiles[focusTile];
  if (!T) return out;
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 8; x++) {
      const i = y * 8 + x;
      if (T.dots[i] !== 1) continue;
      out.push([focusTile, x, y]);
    }
  }
  out.sort((a, b) => a[2] - b[2] || a[1] - b[1]);
  return out.slice(0, 18);
}, FOCUS_TILE);

for (const pop of pops) {
  await page.evaluate(([t, x, y]) => window.__sunslide.popBubbleAt(t, x, y), pop);
}

for (let i = 0; i < 150; i++) {
  await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);
}

await page.evaluate((pose) => {
  window.__sunslide.setView(false);
  window.__sunslide.setCamPose(pose);
}, CAM_POSE);

for (let i = 0; i < 90; i++) {
  await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);
}

const metrics = await page.evaluate(() => ({
  greened: window.__sunslide.greenedCount,
  pose: window.__sunslide.getCamPose?.(),
}));

if (metrics.greened < 8) {
  console.warn('Warning: only', metrics.greened, 'ecology cells; patches may be faint');
}

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

console.log(
  JSON.stringify({
    label,
    seed: CAPTURE_SEED,
    outFull,
    outCrop,
    greened: metrics.greened,
    camPose: CAM_POSE,
    focusTile: FOCUS_TILE,
    pops: pops.length,
    layout,
  }),
);

await browser.close();
preview.kill('SIGTERM');