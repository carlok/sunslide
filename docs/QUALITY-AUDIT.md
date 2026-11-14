# Quality audit (vite preview, `/sunslide/`)

Measured locally against `npm run build` + `vite preview` with Lighthouse 13, headless Chromium + SwiftShader (same constraints as CI smoke tests). Scores are **0–1** Lighthouse category scores.

## Before (pre–SEO/a11y pass)

| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | **0.61** | **0.59** |
| Accessibility | **0.90** | **0.90** |
| Best Practices | **0.96** | **0.96** |
| SEO | **0.90** | **0.90** |

**axe-core:** 3 violations (`landmark-one-main`, `meta-viewport`, `region`).

**html-validate:** 16 errors (mostly `button` missing `type`).

## After

| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | **0.56** | **0.43** |
| Accessibility | **1.00** | **1.00** |
| Best Practices | **1.00** | **1.00** |
| SEO | **1.00** | **1.00** |

**axe-core:** 0 violations.

**html-validate:** 0 errors (after removing redundant `aria-label` on `#lives`).

### Changes made

- Meta description, Open Graph, Twitter cards, canonical, `color-scheme`
- Relaxed viewport (removed `user-scalable=no` / `maximum-scale=1`) for zoom accessibility
- `main` / header / section / footer landmarks, dialog labels, `type="button"`, map `role="img"`
- Slightly brighter `--dim` text for contrast
- `public/favicon.svg`, `site.webmanifest`, `robots.txt`
- Vite `manualChunks` for `three` + async boot entry (hashed assets unchanged via Vite)
- Lighthouse CI job (`treosh/lighthouse-ci-action`) with a11y/SEO/best-practices ≥ 0.9; performance warn ≥ 0.5

### Left as-is (by design)

- **Performance** in CI/local SwiftShader remains modest; chasing score would require cutting WebGL fidelity
- **HTTPS/HSTS/CSP** audits apply on GitHub Pages production, not local `http://127.0.0.1` preview
- Title overlay dialogs still use symbol-heavy toolbar buttons (labels present via `aria-label`)

## Re-run locally

```bash
npm run build
AUDIT_LABEL=after node scripts/quality-audit.mjs
npm run lhci
```