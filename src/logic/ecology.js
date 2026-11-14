/** Bubble-pop ecology: permanent green cell patches + capped decor plan. */
import { TW, TH, NT } from './constants.js';
import { hash } from './helpers.js';

export const N_CELLS = TW * TH;
export const ECOLOGY = {
  maxCells: NT * N_CELLS,
  maxDecorPerCell: 5,
  /** Soft global cap for instanced decor (patches are 1:1 with cells). */
  maxDecorTotal: 240,
  growSeconds: 0.38,
};

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
      scale: 0.85 + rng(tileId, x, y, 3) * 0.35,
      yaw: rng(tileId, x, y, 4) * Math.PI * 2,
    });
  }
  const flowerN = 1 + Math.floor(rng(tileId, x, y, 5) * 2.01);
  for (let f = 0; f < flowerN && decor.length < ECOLOGY.maxDecorPerCell; f++) {
    decor.push({
      kind: 'flower',
      lx: 0.15 + rng(tileId, x, y, 10 + f) * 0.7,
      ly: 0.15 + rng(tileId, x, y, 20 + f) * 0.7,
      scale: 0.7 + rng(tileId, x, y, 30 + f) * 0.5,
      hue: rng(tileId, x, y, 40 + f),
    });
  }
  const grassN = 2;
  for (let g = 0; g < grassN && decor.length < ECOLOGY.maxDecorPerCell; g++) {
    decor.push({
      kind: 'grass',
      lx: 0.1 + rng(tileId, x, y, 50 + g) * 0.8,
      ly: 0.1 + rng(tileId, x, y, 60 + g) * 0.8,
      scale: 0.6 + rng(tileId, x, y, 70 + g) * 0.55,
      yaw: rng(tileId, x, y, 80 + g) * Math.PI * 2,
    });
  }
  return decor.slice(0, ECOLOGY.maxDecorPerCell);
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