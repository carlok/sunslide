/** Sliding UX: movable tiles, snap easing, ghost preview (15-puzzle). */
import { COLS, TW, TH } from './constants.js';
import { clamp, smooth } from './helpers.js';
import { findHole, holeNeighbors } from './slots.js';

/** Snap duration targets (ms); `full` is within the 120–200 ms spec. */
export const SLIDE_SNAP_MS = { full: 170, reduced: 80 };

export function slideSnapDurationSeconds(reducedMotion = false) {
  return (reducedMotion ? SLIDE_SNAP_MS.reduced : SLIDE_SNAP_MS.full) / 1000;
}

/** Maps linear animation time 0–1 to eased slide progress. */
export function slideSnapProgress(linearT, reducedMotion = false) {
  const t = clamp(linearT, 0, 1);
  if (reducedMotion) return t;
  const eased = 1 - (1 - t) ** 2.35;
  return smooth(eased);
}

/**
 * Eased progress for a slide that starts part-way, where the hover/drag preview already moved the
 * island (`startFrac` 0–1 toward the hole), so the tile doesn't hop back to its slot first.
 */
export function slideProgressFrom(startFrac, linearT, reducedMotion = false) {
  const e0 = clamp(Number(startFrac) || 0, 0, 1);
  return e0 + (1 - e0) * slideSnapProgress(linearT, reducedMotion);
}

export function slideLiftAtProgress(linearT, reducedMotion = false) {
  if (reducedMotion) return 0;
  return Math.sin(Math.PI * slideSnapProgress(linearT, reducedMotion));
}

export function movableTileIds(slotGrid) {
  const out = [];
  for (const n of holeNeighbors(slotGrid)) {
    const id = slotGrid[n.r][n.c];
    if (id >= 0) out.push(id);
  }
  return out;
}

export function isMovableSlot(c, r, slotGrid) {
  return holeNeighbors(slotGrid).some((n) => n.c === c && n.r === r);
}

/** Wrap-aware grid delta from tile to empty meadow. */
export function slideDeltaToHole(fromC, fromR, hole = null, slotGrid = null, cols = COLS) {
  const h = hole || findHole(slotGrid);
  let dc = h.c - fromC;
  if (dc > 2) dc -= cols;
  if (dc < -2) dc += cols;
  const dr = h.r - fromR;
  return { dc, dr, hole: h };
}

/** Ghost pull 0–1 → blend toward destination slot (subtle at hover, stronger when dragging). */
export function ghostPreviewBlend(pull01, reducedMotion = false) {
  const pull = clamp(pull01, 0, 1);
  const max = reducedMotion ? 0.14 : 0.42;
  const base = reducedMotion ? 0.08 : 0.16;
  return base + (max - base) * pull;
}

export function ghostTilePosition(fc, fr, dc, dr, pull01, reducedMotion = false, tw = TW, th = TH) {
  const g = ghostPreviewBlend(pull01, reducedMotion);
  return { x: (fc + dc * g) * tw, y: (fr + dr * g) * th };
}

/** Screen drag magnitude → ghost pull (cheap heuristic for any slide axis). */
export function screenDragPull(hypotPx, thresholdPx = 44) {
  return clamp(hypotPx / thresholdPx, 0, 1);
}

export function movableHighlightIntensity(timeSec, lit, reducedMotion = false) {
  const pulse = reducedMotion ? 0.88 : 0.55 + 0.45 * Math.sin(timeSec * 5.2);
  return lit ? 0.26 + 0.2 * pulse : 0.12 + 0.1 * pulse;
}

export function ghostEmissiveIntensity(blend, reducedMotion = false) {
  const g = ghostPreviewBlend(blend, reducedMotion);
  return reducedMotion ? 0.06 + 0.08 * g : 0.1 + 0.22 * g;
}