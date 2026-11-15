/** Reproduce Carlo polar shadow + bisect casters; writes scores and PNGs. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = process.env.BUILD_ROOT || path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = process.env.OUT_DIR || path.join(root, 'tests', 'out', 'carlo-capture');
mkdirSync(out, { recursive: true });
const PORT = Number(process.env.PORT || 4210);
const base = `http://127.0.0.1:${PORT}/sunslide/`;
const BISECT = process.env.BISECT || '';

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
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(base)).ok) return;
    } catch {
      await new Promise((r) => setTimeout(r, 350));
    }
  }
  throw new Error('preview timeout');
}

async function settle(page, n = 70) {
  for (let i = 0; i < n; i++) {
    await page.evaluate((dt) => window.__sunslide.update(dt), 1 / 60);
  }
}

async function bandDarkness(page, pngPath) {
  const buf = [...readFileSync(pngPath)];
  return page.evaluate(async (bytes) => {
    const blob = new Blob([new Uint8Array(bytes)]);
    const bmp = await createImageBitmap(blob);
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    const { width, height, data } = ctx.getImageData(0, 0, c.width, c.height);
    const x0 = Math.floor(width * 0.42);
    const x1 = Math.floor(width * 0.58);
    const y0 = Math.floor(height * 0.12);
    const y1 = Math.floor(height * 0.88);
    let sum = 0;
    let n = 0;
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (width * y + x) << 2;
        sum += 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
        n++;
      }
    }
    return sum / n;
  }, buf);
}

async function applyBisect(page) {
  if (!BISECT) return;
  if (BISECT === 'polar-off') {
    await page.evaluate(() =>
      window.__sunslide.setCastShadowByMaterial(
        ['6b4a2e', '2f6f3d', '3f8c4a', 'f2f6ff', '8f8b84', 'e2453b', 'f3ead8'],
        false,
      ),
    );
  } else if (BISECT === 'wall-off') {
    await page.evaluate(() => window.__sunslide.setTileBatchCastShadow({ wall: false }));
  } else if (BISECT === 'slab-off') {
    await page.evaluate(() => window.__sunslide.setTileBatchCastShadow({ slab: false }));
  } else if (BISECT === 'tiles-off') {
    await page.evaluate(() =>
      window.__sunslide.setTileBatchCastShadow({ wall: false, slab: false }),
    );
  } else if (BISECT === 'polar-only-off') {
    await page.evaluate(() =>
      window.__sunslide.setCastShadowByMaterial(
        ['6b4a2e', '2f6f3d', '3f8c4a', 'f2f6ff'],
        false,
      ),
    );
  }
}

async function capturePose(page, tag, pose) {
  await page.evaluate((p) => {
    window.__sunslide.goTitle();
    window.__sunslide.setQuality(2);
    window.__sunslide.setCamPose({
      state: 'title',
      zoomT: 1,
      zoomTarget: 1,
      viewFar: true,
      skyDay: 0.07,
      ...p,
    });
  }, pose);
  await applyBisect(page);
  await settle(page, 90);
  const file = path.join(out, `${tag}.png`);
  await page.screenshot({ path: file });
  return { tag, file, band: await bandDarkness(page, file), pose };
}

async function main() {
  const stop = startPreview();
  await waitFor();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(base, { waitUntil: 'load' });
  await page.waitForFunction(() => !!window.__sunslide?.setCamPose);
  if (await page.locator('#tutorialSkip').isVisible().catch(() => false)) await page.click('#tutorialSkip');

  const results = [];
  const quick = process.env.QUICK === '1';
  const lonSteps = quick ? 8 : 16;
  const lats = quick ? [0.28, 0.38] : [0.22, 0.32, 0.42];
  const offs = quick ? [2.75, 2.95] : [2.65, 2.85, 3.05];
  for (let ci = 0; ci < lonSteps; ci++) {
    const camLon = (ci / lonSteps) * Math.PI * 2;
    for (const camLat of lats) {
      for (const off of offs) {
        const sunLon = camLon + off;
        const tag = `title-${BISECT || 'main'}-c${ci}-lat${camLat}-s${off.toFixed(2)}`.replace(/\./g, '_');
        results.push(await capturePose(page, tag, { camLon, camLat, sunLon }));
      }
    }
  }

  results.sort((a, b) => a.band - b.band);
  writeFileSync(path.join(out, 'scores.json'), JSON.stringify(results.slice(0, 20), null, 2));
  console.log('darkest', results[0]?.tag, results[0]?.band);
  console.log('wrote', out, 'count', results.length);
  await browser.close();
  stop();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});