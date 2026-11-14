// Headless smoke test — serves the Vite production build via `vite preview`.
import { chromium } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'tests', 'out');
mkdirSync(out, { recursive: true });

const SMOKE_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS) || 8 * 60 * 1000;
const SIM_TICKS = Number(process.env.SMOKE_TICKS) || 6000;

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run `npm run build` before the smoke test');
  process.exit(1);
}

const PORT = Number(process.env.SMOKE_PORT) || 4173;
const baseUrl = `http://127.0.0.1:${PORT}/sunslide/`;

/** Prevent CI hangs: exit if the full smoke run exceeds the budget. */
const smokeDeadline = setTimeout(() => {
  console.error(`smoke test exceeded ${SMOKE_TIMEOUT_MS}ms — aborting`);
  process.exit(124);
}, SMOKE_TIMEOUT_MS);
smokeDeadline.unref();

let previewStop = () => {};

function startPreview() {
  const child = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
    {
      cwd: root,
      stdio: 'ignore',
      detached: true,
      env: { ...process.env, BROWSER: 'none' },
    },
  );
  child.unref();
  previewStop = () => {
    try {
      process.kill(-child.pid, 'SIGTERM');
    } catch {
      try {
        child.kill('SIGTERM');
      } catch {
        /* already dead */
      }
    }
    setTimeout(() => {
      try {
        process.kill(-child.pid, 'SIGKILL');
      } catch {
        try {
          child.kill('SIGKILL');
        } catch {
          /* */
        }
      }
    }, 2000).unref();
  };
  child.on('error', (e) => {
    console.error('preview spawn failed', e);
    process.exit(1);
  });
}

async function waitForServer() {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(baseUrl, { signal: AbortSignal.timeout(5000) });
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('vite preview did not become ready');
}

startPreview();
await waitForServer();

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800, deviceScaleFactor: 1, hasTouch: false, isMobile: false },
  { name: 'phone-portrait', width: 390, height: 780, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
  { name: 'phone-landscape', width: 844, height: 390, deviceScaleFactor: 2, hasTouch: true, isMobile: true },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  timeout: 60_000,
  args: [
    '--use-angle=swiftshader',
    '--enable-unsafe-swiftshader',
    '--ignore-gpu-blocklist',
    '--autoplay-policy=no-user-gesture-required',
    '--headless=new',
  ],
});
let failures = 0;
const fail = (msg) => {
  failures++;
  console.error('FAIL', msg);
};

try {
  for (const vp of VIEWPORTS) {
    const { name, ...opts } = vp;
    const ctx = await browser.newContext({
      viewport: { width: opts.width, height: opts.height },
      ...opts,
    });
    const page = await ctx.newPage();
    page.setDefaultTimeout(60_000);
    page.setDefaultNavigationTimeout(60_000);
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => {
      if (m.type() === 'error') errors.push(m.text());
    });
  // 'load' only — networkidle can hang on WebGL / rAF; gameplay readiness uses __sunslide.
    await page.goto(baseUrl, { waitUntil: 'load', timeout: 60_000 });
    await page.waitForFunction(() => !!window.__sunslide, null, { timeout: 30_000 });
    await page.evaluate(() => window.__sunslide.setQuality(1));
    await page.click('#go', { timeout: 10_000 });
    await page.waitForTimeout(800);

    const res = await page.evaluate(
      ({ ticks }) => {
        const S = window.__sunslide;
        S.inv = 1e9;
        let batLeaks = 0,
          warps = 0,
          last = S.state;
        for (let i = 0; i < ticks; i++) {
          if (i % 25 === 0) S.want = Math.floor(Math.random() * 4);
          if (i % 90 === 0)
            for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) S.trySlide(c, r);
          S.update(0.03);
          for (const g of S.bats)
            if (g.mode === 'live' && (g.a.t !== g.home || (g.a.moving && g.a.nt !== g.home)))
              batLeaks++;
          if (S.state === 'warp' && last !== 'warp') warps++;
          last = S.state;
        }
        const counted = S.tiles.reduce(
          (a, t) => a + t.dots.reduce((x, v) => x + (v ? 1 : 0), 0),
          0,
        );
        const leftSum = S.tiles.reduce((a, t) => a + t.left, 0);
        return { state: S.state, dotsLeft: S.dotsLeft, counted, leftSum, batLeaks, warps };
      },
      { ticks: SIM_TICKS },
      { timeout: 120_000 },
    );
    console.log(name, res);
    if (res.batLeaks) fail(`${name}: bats left their island ${res.batLeaks}×`);
    if (res.dotsLeft !== res.counted || res.leftSum !== res.counted)
      fail(`${name}: bubble counters out of sync`);

    const layout = await page.evaluate(() => {
      const r = (id) => document.getElementById(id).getBoundingClientRect();
      const s = r('stage'),
        m = r('map');
      return {
        stage: [s.width, s.height],
        mapVisible: m.width > 60 && m.height > 40,
        overflowX: document.documentElement.scrollWidth > innerWidth + 1,
        overflowY: document.documentElement.scrollHeight > innerHeight + 1,
      };
    });
    if (layout.stage[0] < 200 || layout.stage[1] < 200)
      fail(`${name}: stage too small ${layout.stage}`);
    if (!layout.mapVisible) fail(`${name}: map not visible`);
    if (layout.overflowX || layout.overflowY) fail(`${name}: page overflows the viewport`);

    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(out, `${name}.png`), timeout: 30_000 });
    if (errors.length) fail(`${name}: console errors\n  ` + errors.slice(0, 5).join('\n  '));
    await ctx.close();
  }
} finally {
  clearTimeout(smokeDeadline);
  await browser.close().catch(() => {});
  previewStop();
}

if (failures) {
  console.error(`${failures} failure(s)`);
  process.exit(1);
}
console.log('smoke test passed — screenshots in tests/out/');