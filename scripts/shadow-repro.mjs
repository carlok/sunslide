#!/usr/bin/env node
/**
 * Capture shadow/lighting regression views (Playwright + built preview).
 *
 * Presets (SHADOW_REPRO_PRESET):
 *   pole-graze  grazing sun over the north cap (original PR #44 view)
 *   far-side    sun directly behind the planet; the visible hemisphere must be dark and free of
 *               wall-shaped shadows (regression for batched tile normals using tile 0's frame)
 *   noon        sun behind the camera; the visible hemisphere must be evenly lit
 *
 * The pose is frozen (paused capture hold, dt=0 frames), so the sun and camera don't drift
 * between setting the pose and taking the screenshot.
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const preset = process.env.SHADOW_REPRO_PRESET || 'pole-graze';
const PRESETS = {
  'pole-graze': { camLon: 1.15, camLat: 0.36, sunOffset: 2.85, lighting: 'night' },
  'far-side': { camLon: 2.2, camLat: 0.25, sunOffset: Math.PI, lighting: 'day' },
  noon: { camLon: 2.2, camLat: 0.25, sunOffset: 0, lighting: 'day' },
};
const base = PRESETS[preset];
if (!base) {
  console.error(`Unknown SHADOW_REPRO_PRESET "${preset}" (use ${Object.keys(PRESETS).join(', ')})`);
  process.exit(1);
}

const outFile =
  process.env.SHADOW_REPRO_OUT ||
  path.join(root, 'tests', 'out', preset === 'pole-graze' ? 'shadow-pole-graze.png' : `shadow-${preset}.png`);
mkdirSync(path.dirname(outFile), { recursive: true });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

const camLon = Number(process.env.SHADOW_REPRO_CAM_LON ?? base.camLon);
const camLat = Number(process.env.SHADOW_REPRO_CAM_LAT ?? base.camLat);
const sunLon = Number(process.env.SHADOW_REPRO_SUN_LON ?? camLon + base.sunOffset);

const host = process.env.PREVIEW_HOST || 'localhost';
const port = Number(process.env.PREVIEW_PORT) || 4175;
const baseUrl = `http://${host}:${port}/sunslide/`;

const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', host, '--port', String(port), '--strictPort'],
  { cwd: root, stdio: 'ignore', env: { ...process.env, BROWSER: 'none' } },
);

let browser;
try {
  let up = false;
  for (let i = 0; i < 120 && !up; i++) {
    try {
      up = (await fetch(baseUrl)).ok;
    } catch {
      /* wait */
    }
    if (!up) await new Promise((r) => setTimeout(r, 250));
  }
  if (!up) throw new Error(`preview did not start on ${baseUrl}`);

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.addInitScript(() => {
    window.__ssSmokeNoFullscreen = true;
    try {
      localStorage.setItem('sunslide.tutorialSeen', 'true');
    } catch {
      /* private mode */
    }
  });
  await page.goto(baseUrl, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__sunslide?.setEcologyCaptureView, null, { timeout: 30000 });

  await page.evaluate(
    (p) => {
      const S = window.__sunslide;
      S.setQuality(2);
      // Capture hold: pauses the sim so the pose stays put while we render and screenshot.
      S.setEcologyCaptureView(0, p.lighting);
      S.setCamPose({ camLon: p.camLon, camLat: p.camLat, sunLon: p.sunLon, zoomT: 1, zoomTarget: 1, viewFar: true });
      document.getElementById('ov')?.classList.add('hide');
      for (let i = 0; i < 4; i++) S.drawCaptureFrame();
    },
    { camLon, camLat, sunLon, lighting: base.lighting },
  );
  await page.waitForTimeout(150);
  await page.screenshot({ path: outFile });
  console.log('Wrote', path.relative(root, outFile));
  console.log('Pose', { preset, camLon, camLat, sunLon });
} finally {
  await browser?.close().catch(() => {});
  preview.kill('SIGTERM');
}
