#!/usr/bin/env node
/** Split index.html module script into ordered fragment files (shared scope via Vite concat). */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'extracted', 'sunslide', 'index.html');
const outDir = path.join(root, 'src', 'game', 'frags');
mkdirSync(outDir, { recursive: true });

const html = readFileSync(src, 'utf8');
const m = html.match(/<script type="module">\n([\s\S]*)\n<\/script>\s*\n<\/body>/);
if (!m) throw new Error('module script not found');
let js = m[1];

// Remove three imports (handled by virtual entry header)
js = js
  .replace(/^import \* as THREE from 'three';\n/, '')
  .replace(/^import \{EffectComposer\}[^\n]+\n/, '')
  .replace(/^import \{RenderPass\}[^\n]+\n/, '')
  .replace(/^import \{UnrealBloomPass\}[^\n]+\n/, '')
  .replace(/^import \{OutputPass\}[^\n]+\n/, '')
  .replace(/^window\.__ssBoot=true;\n\n/, '');

const MARK = /\/\* =+\n {3}([^\n]+)\n {3}=+ \*\//g;
const parts = [];
let last = 0;
let lastTitle = 'bootstrap';
for (const match of js.matchAll(MARK)) {
  const start = match.index;
  if (start > last) {
    const chunk = js.slice(last, start).trim();
    if (chunk) parts.push({ title: lastTitle, body: chunk });
  }
  lastTitle = match[1].trim();
  last = start + match[0].length;
}
const tail = js.slice(last).trim();
if (tail) parts.push({ title: lastTitle, body: tail });

const names = parts.map((p, i) => {
  const slug = String(i + 1).padStart(2, '0') + '-' + p.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48);
  const file = slug + '.js';
  writeFileSync(path.join(outDir, file), p.body + '\n', 'utf8');
  return file;
});

writeFileSync(
  path.join(root, 'src', 'game', 'frag-order.json'),
  JSON.stringify(names, null, 2) + '\n',
  'utf8',
);

// Extract HTML shell + CSS
const styleM = html.match(/<style>([\s\S]*?)<\/style>/);
const css = styleM ? styleM[1] : '';
mkdirSync(path.join(root, 'src'), { recursive: true });
writeFileSync(path.join(root, 'src', 'styles.css'), css.trim() + '\n', 'utf8');

const bodyM = html.match(/<body>([\s\S]*?)<script>\nwindow\.__ssFail/);
const failScript = html.match(/<script>\n(window\.__ssFail[\s\S]*?)<\/script>/)[1];

writeFileSync(
  path.join(root, 'index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
<meta name="theme-color" content="#04050d">
<meta property="og:image" content="https://carlok.github.io/sunslide/assets/hero.png">
<title>Sunslide</title>
<link rel="stylesheet" href="/src/styles.css">
</head>
<body>
${bodyM ? bodyM[1] : ''}
<script>
${failScript}
</script>
<script type="module" src="/src/main.js"></script>
</body>
</html>
`,
  'utf8',
);

console.log('Wrote', names.length, 'fragments to', outDir);