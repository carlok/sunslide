import { TW, TH, COLS, ROWS, DX, DY, LIFT } from './constants.js';
import { smooth } from './helpers.js';

export const isHome = (T) =>
  !T.anim && T.slot.c === T.id % COLS && T.slot.r === ((T.id / COLS) | 0);

export function findHole(slotGrid) {
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) if (slotGrid[r][c] < 0) return { c, r };
  return { c: 3, r: 3 };
}

export function holeNeighbors(slotGrid) {
  const h = findHole(slotGrid);
  const out = [];
  for (let d = 0; d < 4; d++) {
    const c = (h.c + DX[d] + COLS) % COLS;
    const r = h.r + DY[d];
    if (r >= 0 && r < ROWS) out.push({ c, r, d });
  }
  return out;
}

export function slideInstant(slotGrid, tiles, c, r) {
  const h = findHole(slotGrid);
  const id = slotGrid[r][c];
  slotGrid[h.r][h.c] = id;
  slotGrid[r][c] = -1;
  tiles[id].slot = { c: h.c, r: h.r };
}

export function tilePos(T) {
  const a = T.anim;
  if (!a) return { x: T.slot.c * TW, y: T.slot.r * TH };
  const e = smooth(a.t);
  return { x: (a.fc + a.dc * e) * TW, y: (a.fr + a.dr * e) * TH };
}

export const liftOf = (T) => (T.anim ? Math.sin(Math.PI * T.anim.t) * LIFT : 0);

export function slotDist(a, b) {
  const dc = Math.abs(a.c - b.c);
  return Math.min(dc, COLS - dc) + Math.abs(a.r - b.r);
}