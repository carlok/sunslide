/** Single-frame Carlo shadow before/after at fixed pose. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.BUILD_ROOT || path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PORT = Number(process.env.PORT || 4212);
const base = `http://127.0.0.1:${PORT}/sunslide/`;
const out = process.env.OUT || '/opt/cursor/artifacts/carlo-shadow-before.png';
const BISECT = process.env.BISECT || '';

const pose = {
  camLon: 1.15,
  camLat: 0.36,
  sunLon: 1.15 + 2.85,
  skyDay: 0.06,
};

function startPreview() {
  const child = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    { cwd: root, stdio: 'ignore', detached: true, env: { ...process.env, BROWSER: 'none' } },
  );
  child.unref();
  return () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        /* */
      }
    }
  };
}

async function waitFor() {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error('preview timeout');
}

async function main() {
  const scoresPath = path.join(root, 'tests/out/carlo-capture/scores.json');
  try {
    const top = JSON.parse(readFileSync(scoresPath, 'utf8'))[0]?.pose;
    if (top) Object.assign(pose, top);
  } catch {
    /* default pose */
  }
  mkdirSync(path.dirname(out), { recursive: true });
  const stop = startPreview();
  await waitFor();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__sunslide?.setCamPose);
  for (let t = 0; t < 3; t++) {
    if (await page.locator('#tutorialSkip').isVisible().catch(() => false)) {
      await page.click('#tutorialSkip');
      await page.waitForTimeout(200);
    }
  }
  await page.evaluate((p) => {
    window.__sunslide.goTitle();
    window.__sunslide.setQuality(2);
    window.__sunslide.setCamPose({ state: 'title', zoomT: 1, zoomTarget: 1, viewFar: true, ...p });
  }, pose);
  if (BISECT === 'polar-off') {
    await page.evaluate(() =>
      window.__sunslide.setCastShadowByMaterial(
        ['6b4a2e', '2f6f3d', '3f8c4a', 'f2f6ff', '8f8b84', 'e2453b', 'f3ead8'],
        false,
      ),
    );
  } else if (BISECT === 'tiles-off') {
    await page.evaluate(() =>
      window.__sunslide.setTileBatchCastShadow({ wall: false, slab: false }),
    );
  }
  for (let i = 0; i < 48; i++) await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);
  await page.screenshot({ path: out });
  console.log('wrote', out, 'pose', pose, 'bisect', BISECT || 'none');
  await browser.close();
  stop();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});