/** Bubble-pop ecology: permanent green cell patches + capped decor plan. */
import { TW, TH, NT, CW, CH } from './constants.js';
import { hash } from './helpers.js';

export const N_CELLS = TW * TH;
export const ECOLOGY = {
  maxCells: NT * N_CELLS,
  maxDecorPerCell: 5,
  /** Soft global cap for instanced decor (patches are 1:1 with cells). */
  maxDecorTotal: 240,
  growSeconds: 0.38,
};

/**
 * One maze floor cell in instanced surface-tangent units (gx→CW, gy→CH on the sphere).
 * Renderer `surfMatrix` sx/sz must match these — not tile-space 0..1 counts.
 */
export const CELL_TANGENT = { sx: CW * 0.94, sz: CH * 0.94 };
export const PATCH_THICK = 0.0035;
export const PATCH_LIFT = 0.0018;
/** Max decor height (sy + lift) and local placement radius in cell fractions. */
export const DECOR_LIMITS = { maxHeight: 0.036, maxRadiusFrac: 0.4 };

export function cellFootprintTangent() {
  return { ...CELL_TANGENT, thick: PATCH_THICK, lift: PATCH_LIFT };
}

/** Local offset within one cell (game coords, ~0.5 = cell center). */
export function decorLocalOffset(d) {
  const spread = 0.7;
  return { x: (d.lx - 0.5) * spread, y: (d.ly - 0.5) * spread };
}

/** Instanced decor scales; `scale` is the seeded 0..1-ish factor from planCellDecor. */
export function decorTangentScale(kind, scale) {
  const s = scale;
  if (kind === 'grass') {
    return { sx: 0.006 * s, sy: 0.009 * s, sz: 0.006 * s, lift: 0.003 };
  }
  if (kind === 'flower') {
    return { sx: 0.0075 * s, sy: 0.0075 * s, sz: 0.0075 * s, lift: 0.0035 };
  }
  if (kind === 'tree') {
    return {
      trunk: { sx: 0.01 * s, sy: 0.018 * s, sz: 0.01 * s, lift: 0.004 },
      top: { sx: 0.014 * s, sy: 0.022 * s, sz: 0.014 * s, lift: 0.014 * s },
    };
  }
  return { sx: 0.006 * s, sy: 0.006 * s, sz: 0.006 * s, lift: 0.003 };
}

export function decorHeightEstimate(kind, scale) {
  const sc = decorTangentScale(kind, scale);
  if (kind === 'tree') return sc.top.sy + sc.top.lift;
  return sc.sy + sc.lift;
}

export function decorInsideCell(d) {
  const r = Math.max(Math.abs(d.lx - 0.5), Math.abs(d.ly - 0.5)) * 0.7;
  return (
    r <= DECOR_LIMITS.maxRadiusFrac &&
    decorHeightEstimate(d.kind, d.scale) <= DECOR_LIMITS.maxHeight
  );
}

export function cellKey(tileId, x, y) {
  return tileId * N_CELLS + y * TW + x;
}

export function parseCellKey(key) {
  const tileId = Math.floor(key / N_CELLS);
  const i = key % N_CELLS;
  return { tileId, x: i % TW, y: Math.floor(i / TW) };
}

export function createEcologyState() {
  return { byCell: new Map(), decorTotal: 0 };
}

export function clearEcology(state) {
  state.byCell.clear();
  state.decorTotal = 0;
}

export function ecologyCount(state) {
  return state.byCell.size;
}

function rng(tileId, x, y, salt) {
  return hash(tileId, x, y + salt * 17.3, salt * 0.71);
}

/** Seeded decor layout for one cell (local 0..1 coords). */
export function planCellDecor(tileId, x, y) {
  const decor = [];
  const treeR = rng(tileId, x, y, 0);
  if (treeR < 0.42) {
    decor.push({
      kind: 'tree',
      lx: 0.22 + rng(tileId, x, y, 1) * 0.56,
      ly: 0.22 + rng(tileId, x, y, 2) * 0.56,
      scale: 0.55 + rng(tileId, x, y, 3) * 0.35,
      yaw: rng(tileId, x, y, 4) * Math.PI * 2,
    });
  }
  const flowerN = 1 + Math.floor(rng(tileId, x, y, 5) * 2.01);
  for (let f = 0; f < flowerN && decor.length < ECOLOGY.maxDecorPerCell; f++) {
    decor.push({
      kind: 'flower',
      lx: 0.15 + rng(tileId, x, y, 10 + f) * 0.7,
      ly: 0.15 + rng(tileId, x, y, 20 + f) * 0.7,
      scale: 0.65 + rng(tileId, x, y, 30 + f) * 0.35,
      hue: rng(tileId, x, y, 40 + f),
    });
  }
  const grassN = 2;
  for (let g = 0; g < grassN && decor.length < ECOLOGY.maxDecorPerCell; g++) {
    decor.push({
      kind: 'grass',
      lx: 0.1 + rng(tileId, x, y, 50 + g) * 0.8,
      ly: 0.1 + rng(tileId, x, y, 60 + g) * 0.8,
      scale: 0.55 + rng(tileId, x, y, 70 + g) * 0.35,
      yaw: rng(tileId, x, y, 80 + g) * Math.PI * 2,
    });
  }
  return decor.slice(0, ECOLOGY.maxDecorPerCell);
}

/** 0–1 HSL green meadow base (seeded per maze cell). */
export function ecologyPatchColor(tileId, x, y) {
  const h = 0.3 + (rng(tileId, x, y, 90) - 0.5) * 0.18;
  const s = 0.45 + rng(tileId, x, y, 91) * 0.35;
  const l = 0.26 + rng(tileId, x, y, 92) * 0.2;
  return { h, s, l };
}

function hslChannel(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

/** sRGB 0–1 (pass THREE.SRGBColorSpace to Color.setRGB). */
export function ecologyPatchRgb(tileId, x, y) {
  const { h, s, l } = ecologyPatchColor(tileId, x, y);
  if (s <= 0.0001) return { r: l, g: l, b: l };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return {
    r: hslChannel(p, q, h + 1 / 3),
    g: hslChannel(p, q, h),
    b: hslChannel(p, q, h - 1 / 3),
  };
}

/** Smooth 0–1 grow factor from seconds since pop. */
export function ecologyGrowFactor(elapsedSeconds, growSeconds = ECOLOGY.growSeconds) {
  const t = Math.max(0, Math.min(1, elapsedSeconds / growSeconds));
  return t * t * (3 - 2 * t);
}

export function markBubbleCollected(state, tileId, x, y, growAt = 0) {
  if (tileId < 0 || tileId >= NT || x < 0 || x >= TW || y < 0 || y >= TH) return false;
  const key = cellKey(tileId, x, y);
  if (state.byCell.has(key)) return false;
  const decor = planCellDecor(tileId, x, y);
  state.byCell.set(key, { tileId, x, y, growAt, decor });
  state.decorTotal = Math.min(
    ECOLOGY.maxDecorTotal,
    state.decorTotal + decor.length,
  );
  return true;
}