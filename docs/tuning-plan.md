# Sunslide tuning plan

**Context:** First community fork — [sunslide-ko](https://github.com/sigco3111/sunslide-ko) (Korean UI translation). Carlo’s write-up: [Sunslide forked](https://carlok.github.io/blog/2026/11/17/sunslide-forked-sigco3111/).

**Baseline:** `main` at `0cec54f` (post PR #44 polar shadow fix). Measurements below are from this tree unless noted.

**Standing goals:** Keep the **15-puzzle sliding mechanic** (see `docs/GAME_DESIGN.md`, citations in repo), Apache-2.0, and playable performance on mid-tier mobile browsers.

---

## Summary table

| ID | Area | Item | Size | Priority |
|----|------|------|------|----------|
| L1 | Look | Organic ecology floor patches (uniform green boxes) — **done** (#46) | **M** | **P0** |
| L2 | Look | Ecology patch / grass hue tied to color-blind palette | S | P2 |
| L3 | Look | Bloom pass cost vs marginal benefit on Low/Medium | M | P2 |
| G1 | GPU | Draw-call batching for instanced decor (eco + bloom) | L | P3 |
| G2 | GPU | Shadow map tiering (High = 2048 in `QUAL` vs policy cap 1024) — **done**: `QUAL[2].shadow` = 1024 | S | P1 |
| G3 | GPU | Auto quality: cadence-aware step-down + re-upgrade with backoff — **done** | S | P2 |
| G4 | GPU | Pause / menu render idling (`renderIdle` policy) | S | P2 |
| U1 | UX | Centralise UI copy for forks (`sunslide-ko`) — **done**: en/it/ko tables (#47) | **M** | **P1** |
| U2 | UX | Tutorial copy vs HUD toast timing | S | P2 |
| U3 | UX | Map tap target on coarse pointers | S | P1 |
| U4 | UX | Win / clear overlays keyboard focus trap audit | S | P2 |
| F1 | Feel | Slide snap duration vs `CFG.slideCool` (real snap is 170 ms via `SLIDE_SNAP_MS`; `CFG.slideT` is unused) — slides now continue from the hover/drag preview instead of hopping back | S | P2 |
| F2 | Feel | Haptics on bubble collect (already wired) — expose in tutorial | S | P3 |
| B1 | Rules | Visible awake bat = can catch (hidden spawn wait + roost ring, shield bounce, sphere contact, gone stays gone) — **done** | S | P1 |
| B2 | Look | Bubble seed contrast (hot pink, rim ink, no yellow specks) + rare prism bubbles — **done**, guarded by `bubble-contrast.test.js` | S | P1 |
| G5 | GPU | No mid-play shader compiles: warm all objects at boot, bloom variants compiled before the deferred swap, tile materials kept across sectors — **done** | S | P1 |
| G6 | GPU | Resize via rAF (no blank frame from `ResizeObserver`), `pow` NaN guards for bloom — **done** | S | P1 |
| U5 | UX | Phone portrait: view offset keeps Pip above the minimap — **done** | S | P1 |

**Legend:** Size S ≈ hours, M ≈ 1–2 dev days, L ≈ multi-day. Priority P0–P3.

---

## Evidence (measurements)

### Rendering & GPU

| Signal | Source | Value (Q2, 1280×720, SwiftShader headless) |
|--------|--------|-----------------------------------------------|
| Draw calls (play, ~2 s after `#go`) | `window.__sunslide.getRenderMetrics()` | **~163** |
| Pixel ratio | same | **1** (adaptive DPR cap active in CI-like env) |
| Bloom + composer | same | `useBloom: true`, composer RT 1280×720 |
| Tile terrain | `05-renderer.js` `BatchedMesh` | **4** batches (floor/wall/lamp/slab); floor receives; wall+slab cast shadows |
| Ecology cap | `src/logic/ecology.js` | **480** cell patches max (`NT×TW×TH`), **240** decor instances |
| Shadow map | `11-quality-sizing-loop.js` `QUAL[2].shadow` | **1024** (matches the `resolveShadowSettings()` desktop cap in `shadows-policy.js`) |
| Polar decor | PR #44 | `castShadow=false` on north-cap trees. The planet-sized "structural" shadows were really batched tile normals using tile 0's frame (`wireBatchSphereMat`, fixed; guarded by the `tile-lighting` smoke check and `npm run shadow:repro`). Polar shadows stay off: at grazing sun they still add long thin streaks |

### Lighthouse (documented CI / local SwiftShader)

From `docs/QUALITY-AUDIT.md` (post a11y pass):

| Category | Mobile | Desktop |
|----------|--------|---------|
| Performance | 0.56 | 0.43 |
| Accessibility | 1.00 | 1.00 |
| Best practices | 1.00 | 1.00 |
| SEO | 1.00 | 1.00 |

Performance is intentionally capped by WebGL fidelity (three.js planet + post bloom), not DOM weight (main bundle ~112 kB game + 528 kB three chunk).

### Input & feel

| Parameter | Location | Value |
|-----------|----------|-------|
| Slide animation | `SLIDE_SNAP_MS` (`src/logic/slide-feel.js`; `CFG.slideT` is unused) | **170 ms** (80 ms reduced motion) |
| Post-slide cooldown | `CFG.slideCool` | **0.3 s** |
| Hop speed | `CFG.pSpeed` | **4.2** cells/s equivalent |
| Slide duration override | `slideSnapDurationSeconds(REDUCED)` | Shorter when reduced motion |

Input paths: keyboard (`10-input.js`), pointer map, gamepad standard mapping (`11-quality-sizing-loop.js`). No dedicated latency benchmark yet — smoke uses ~6000 sim ticks (`tests/smoke.mjs`).

### UX / localisation

- **Copy today:** HTML strings in `index.html`, tutorial steps in `src/logic/tutorial.js`, dynamic `say()` / HUD in game frags — **no single string table**.
- **Fork pain:** Korean fork must patch multiple files; drift risk on tutorial + menu + win screen (`src/win-screen.js`).
- **A11y:** Landmarks and dialog labels fixed (axe 0 violations per audit).

---

## Look & feel

### L1 — Organic ecology floor (P0, **medium**) — **implement now (separate PR)**

**Finding:** Bubble pops call `markBubbleCollected()` → `syncEcology()` places uniform `ecoPatchMat` (`#4caf5a`) boxes (`05-renderer.js` ~505–508). Reads as flat paint, not meadow.

**Direction:** Per-cell `instanceColor` + light shader mottling; keep single instanced mesh (no extra draw calls). Growth already uses `ECOLOGY.growSeconds` (0.38).

### L2 — Color-blind ecology hues (P2, small)

**Finding:** `visual-theme.js` swaps island `PALETTE` but ecology green is hard-coded in renderer.

**Direction:** Derive patch base hue from `paletteForMode()` or a dedicated ecology ramp.

### L3 — Bloom on Medium (P2, medium)

**Finding:** Q1 enables bloom + shadows + 1.5 DPR (`QUAL[1]`). Composer doubles full-screen cost.

**Direction:** A/B: bloom only on Q2 or during “celebration” states; measure draw calls and Lighthouse perf.

---

## GPU performance

### G1 — Instanced decor consolidation (P3, large)

**Finding:** Ecology uses 5 instanced layers (patches, grass, flower, trunk, top); bloom adds 3 more. Each is a draw call when count > 0.

**Direction:** Merge grass/flower into one multi-material batch only if profiling shows win (>5% frame time). High risk for little gain at current caps.

### G2 — Align shadow map spec with policy (P1, small)

**Finding:** `QUAL[2].shadow: 2048` but `shadowMapResolution()` returns max 1024 for non-mobile — confusing and wastes setup logic.

**Direction:** Set `QUAL[2].shadow` to 1024 or teach policy to honour explicit High tier; document in `shadows-policy.js`.

### G3 — Auto quality backoff (P2, small)

**Finding:** `perfSample()` dropped one Q level when the 90-frame average was **> 24 ms** and never stepped back up. Inter-frame time is not render cost: 30 Hz panels, iOS Low Power Mode and Chrome Energy Saver deliver ~33 ms frames however cheap they are, so those devices fell from High to Low in ~14 s. `tickAdaptiveDpr` had the same blind spot.

**Done:** `src/logic/frame-cadence.js` estimates the display cadence (10th percentile of recent rAF intervals, capped at ~30 Hz). `src/logic/auto-quality.js` steps down only when a window is slow (> 24 ms) **and** behind that cadence by 20% or CPU work fills 80% of the frame; it steps up after 30 s of good windows, doubling the wait each time an upgrade fails within 20 s (up to 8 min). The DPR ticker treats frames on cadence as keeping pace and doubles its recovery hold after a failed step up. `?debug` shows quality, cadence and the last window verdict (`getRenderMetrics().cadenceMs` / `.autoQuality`).

**Known limit:** a GPU-bound renderer pinned at exactly two vsyncs on a 60 Hz panel, with an idle CPU, looks the same as a 30 Hz cap and keeps its tier (a steady 30 fps).

### G4 — Idle rendering on title/pause (P2, small)

**Finding:** `renderLoopPolicy` + pause can stop clock; shadow refresh on title still updates (`shouldUpdateShadowMap`).

**Direction:** Extend idle pause to skip bloom passes when `renderedPaused` and HUD static.

---

## UX / UI

### U1 — String table / i18n (P1, **medium**) — **proposed, not scheduled**

**Finding:** Fork `sunslide-ko` duplicates UI across HTML + JS modules. No `lang` switching at runtime.

**Direction:** Add `src/i18n/en.js` (and `ko.js` optional downstream), thin `t(key)` helper; keep English default; document for translators. **Clean boundary:** game logic stays key-based; HTML uses data-i18n or injected on boot.

*Agent recommendation: implement after L1 lands — one focused PR, no gameplay change.*

### U2 — Tutorial vs first-run HUD (P2, small)

**Finding:** `tutorial.js` three steps; smoke skips via `#tutorialSkip`. Some strings overlap title overlay in `index.html`.

**Direction:** Deduplicate copy; single source for “how to slide”.

### U3 — Map hit targets (P1, small)

**Finding:** `touch-target.js` exists; map is 2D canvas — verify 44×44 px min on phone layouts (smoke runs phone portrait/landscape).

**Direction:** Expand invisible tap padding in map projection when `coarsePointer`.

### U4 — Dialog focus (P2, small)

**Finding:** Win block + menu panel use `role="dialog"`; smoke does not exhaust Tab cycles.

**Direction:** Playwright test: focus stays in open dialog.

---

## Feel (gameplay)

### F1 — Slide timing tuning (P2, small)

**Finding:** Fixed `slideT` / `slideCool` for all levels; `slide-feel.js` only adjusts reduced motion.

**Direction:** Optional subtle ease tweak per `level` or ecology % (planet “heavier” when greener).

### F2 — Haptics discoverability (P3, small)

**Finding:** `haptics.bubbleCollect()` on pop; setting in menu.

**Direction:** Tutorial step 2 mention; no code change if copy-only.

---

## Suggested implementation order

1. **L1** organic ecology floor (current agent PR).
2. **G2** shadow map clarity + **U3** map targets (quick wins).
3. **U1** i18n string table (support forks like sunslide-ko).
4. **G3/G4** performance polish.
5. **L3** bloom tier review.

---

## Verification habits

```bash
npm run lint && npm run test:unit && npm run build && npm run test:smoke
npm run lhci   # performance + a11y gates in CI
node scripts/shadow-repro.mjs   # grazing sun regression (PR #44)
```

Contacts: **@carlok** (GitHub).