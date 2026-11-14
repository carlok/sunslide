#!/usr/bin/env node
/**
 * Lighthouse (mobile + desktop), axe-core, and HTML validation against vite preview.
 * Usage: AUDIT_LABEL=before|after node scripts/quality-audit.mjs
 */
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { HtmlValidate } from 'html-validate';
import lighthouse from 'lighthouse';
import * as chromeLauncher from 'chrome-launcher';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const label = process.env.AUDIT_LABEL || 'audit';
const outDir = path.join(root, 'audit', label);
mkdirSync(outDir, { recursive: true });

const PORT = Number(process.env.AUDIT_PORT) || 4173;
const baseUrl = `http://127.0.0.1:${PORT}/sunslide/`;

const preview = spawn(
  'npx',
  ['vite', 'preview', '--host', '127.0.0.1', '--port', String(PORT), '--strictPort'],
  { cwd: root, stdio: 'ignore', env: { ...process.env, BROWSER: 'none' } },
);

async function waitReady() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    try {
      if ((await fetch(baseUrl)).ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error('preview not ready');
}

const CHROME_FLAGS = [
  '--headless=new',
  '--no-sandbox',
  '--disable-gpu',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--ignore-gpu-blocklist',
];

function summarizeLh(report) {
  const c = report.categories;
  return {
    performance: c.performance?.score ?? null,
    accessibility: c.accessibility?.score ?? null,
    'best-practices': c['best-practices']?.score ?? null,
    seo: c.seo?.score ?? null,
  };
}

async function runLighthouse(formFactor) {
  const chrome = await chromeLauncher.launch({ chromeFlags: CHROME_FLAGS });
  try {
    const options = {
      logLevel: 'error',
      output: 'json',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      port: chrome.port,
      formFactor,
      screenEmulation:
        formFactor === 'mobile'
          ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
          : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    };
    const runnerResult = await lighthouse(baseUrl, options);
    const report = runnerResult.lhr;
    const file = path.join(outDir, `lighthouse-${formFactor}.json`);
    writeFileSync(file, JSON.stringify(report, null, 2));
    return { file, scores: summarizeLh(report) };
  } finally {
    await chrome.kill();
  }
}

async function runAxe() {
  const browser = await chromium.launch({ args: CHROME_FLAGS });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const page = await context.newPage();
  await page.goto(baseUrl, { waitUntil: 'networkidle' });
  const results = await new AxeBuilder({ page }).analyze();
  writeFileSync(path.join(outDir, 'axe.json'), JSON.stringify(results, null, 2));
  await browser.close();
  return results.violations;
}

async function runHtmlValidate() {
  const htmlPath = path.join(root, 'dist', 'index.html');
  const html = readFileSync(htmlPath, 'utf8');
  const validator = new HtmlValidate();
  const report = await validator.validateString(html, 'dist/index.html');
  writeFileSync(
    path.join(outDir, 'htmlvalidate.json'),
    JSON.stringify(report, null, 2),
  );
  return report;
}

try {
  await waitReady();
  const mobile = await runLighthouse('mobile');
  const desktop = await runLighthouse('desktop');
  const violations = await runAxe();
  const htmlReport = await runHtmlValidate();

  const summary = {
    label,
    url: baseUrl,
    lighthouse: { mobile: mobile.scores, desktop: desktop.scores },
    axeViolationCount: violations.length,
    axeViolations: violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      description: v.description,
      nodes: v.nodes.length,
    })),
    htmlValid: htmlReport.valid,
    htmlErrorCount: htmlReport.errorCount,
  };
  writeFileSync(path.join(outDir, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
} finally {
  preview.kill('SIGTERM');
}