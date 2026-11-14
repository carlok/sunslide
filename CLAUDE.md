# Sunslide — notes for Claude Code

WebGL arcade game built with **Vite + ES modules**. three.js comes from npm (`dependencies`). Procedural textures, meshes, and audio. Rules and tuning: `docs/GAME_DESIGN.md`.

## Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Vite dev server (default port 5173) |
| `npm run build` | Production build to `dist/` (`base`: `/sunslide/`) |
| `npm test` | Vitest (unit + coverage on `src/logic/`) then Playwright smoke on the build |
| `npm run hero` | Regenerate `assets/hero.png` from a built game (after `npm run build`) |

Smoke screenshots land in `tests/out/`. Check them after visual changes.

## Layout

```
index.html              Shell + link to src/styles.css and src/main.js
src/main.js             Boots virtual:sunslide-game
src/game/frags/*.js     Game slices (shared scope via Vite concat plugin — not separate ES scopes)
src/logic/              Pure logic (unit-tested; no three.js meshes)
src/render/             (future) — render code lives in frags 05–06 today
src/ui/                 (future) — HUD/minimap/input in frags 07–10
docs/GAME_DESIGN.md     Design doc
tests/unit/             Vitest
tests/smoke.mjs         Playwright invariants + layout screenshots
```

**Logic vs render:** `src/logic/` holds maze, movement graph (`nbr` / seam crossing / east–west wrap), BFS, slots, light, scoring, store. The concatenated game frags keep the original logic/render split: rule functions do not assign three.js meshes (sync layer copies state).

### Coordinate systems

Same as the single-file version: 4×4 slots × 8×4 cells, `gx` wraps east–west, latitudes ±70°, tile→sphere shader patch in render frag.

### Conventions

- `window.__sunslide` debug hook is assembled in `vite.config.js` (`startSunslide`). Tests depend on it.
- Prefer literal glyphs (★ ✿ —) in source, not `\u` escapes.

## Regenerating frags from legacy HTML

If you still have a monolithic `index.html`, run `node scripts/split-frags.mjs` (expects `extracted/sunslide/index.html`).

## Known follow-ups

See `docs/GAME_DESIGN.md` and the original issue list: real-device WebGL, gamepad on hardware, optional further ES-module extraction of render frags into `src/render/*`.