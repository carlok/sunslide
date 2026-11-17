#!/usr/bin/env node
/** Capture title screen + HUD for en, it, ko from a production build. */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir =
  process.env.I18N_CAPTURE_OUT ||
  path.join('/opt/cursor/artifacts', 'i18n');
mkdirSync(outDir, { recursive: true });

if (!existsSync(path.join(root, 'dist', 'index.html'))) {
  console.error('Run npm run build first');
  process.exit(1);
}

const PORT = Number(process.env.PREVIEW_PORT) || 4177;
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

for (const lang of ['en', 'it', 'ko']) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(`${baseUrl}?lang=${lang}`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => !!window.__sunslide, null, { timeout: 30000 });
  await page.waitForFunction(
    (l) => document.documentElement.lang === l,
    lang,
    { timeout: 5000 },
  );
  await page.screenshot({
    path: path.join(outDir, `title-${lang}.png`),
    fullPage: false,
  });

  await page.evaluate(() => window.__sunslide.startGame());
  await page.waitForTimeout(1200);
  await page.evaluate(() => {
    const S = window.__sunslide;
    S.inv = 1e9;
    for (let i = 0; i < 200; i++) {
      S.want = i % 4;
      if (i % 50 === 0) S.trySlide?.(1, 0);
      S.update(0.03);
    }
    if (typeof S.refreshHud === 'function') S.refreshHud();
  });
  await page.waitForTimeout(300);
  const hud = await page.$('#hud');
  if (hud) {
    await hud.screenshot({ path: path.join(outDir, `hud-${lang}.png`) });
  }
  await page.close();
}

await browser.close();
preview.kill('SIGTERM');
console.log(`Wrote screenshots to ${outDir}`);