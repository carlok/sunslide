import { describe, expect, it } from 'vitest';
import {
  SLIDE_SNAP_MS,
  ghostPreviewBlend,
  ghostTilePosition,
  isMovableSlot,
  movableTileIds,
  screenDragPull,
  slideDeltaToHole,
  slideSnapDurationSeconds,
  slideSnapProgress,
} from '../../src/logic/slide-feel.js';
import { COLS, ROWS } from '../../src/logic/constants.js';

function solvedGrid() {
  const g = [...Array(ROWS)].map(() => Array(COLS).fill(-1));
  let k = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (r === 3 && c === 3) continue;
      g[r][c] = k++;
    }
  return g;
}

describe('slide-feel', () => {
  it('snap duration respects reduced motion', () => {
    expect(slideSnapDurationSeconds(false)).toBeCloseTo(SLIDE_SNAP_MS.full / 1000);
    expect(slideSnapDurationSeconds(true)).toBeLessThan(slideSnapDurationSeconds(false));
  });

  it('slideSnapProgress eases toward 1', () => {
    expect(slideSnapProgress(0)).toBe(0);
    expect(slideSnapProgress(1)).toBe(1);
    expect(slideSnapProgress(0.5, false)).toBeGreaterThan(0.4);
    expect(slideSnapProgress(0.5, true)).toBe(0.5);
  });

  it('movable tiles are hole neighbors only', () => {
    const grid = solvedGrid();
    const ids = movableTileIds(grid);
    expect(ids).toContain(14);
    expect(ids).toContain(11);
    expect(ids).not.toContain(0);
    expect(isMovableSlot(3, 2, grid)).toBe(true);
    expect(isMovableSlot(0, 0, grid)).toBe(false);
  });

  it('slideDeltaToHole wraps east-west', () => {
    const d = slideDeltaToHole(0, 3, { c: 3, r: 3 });
    expect(d.dc).toBe(-1);
    expect(d.dr).toBe(0);
  });

  it('ghost preview moves toward hole', () => {
    const p = ghostTilePosition(0, 0, 1, 0, 1, false);
    expect(p.x).toBeGreaterThan(0);
    expect(p.y).toBe(0);
    expect(ghostPreviewBlend(0, false)).toBeLessThan(ghostPreviewBlend(1, false));
  });

  it('screenDragPull clamps', () => {
    expect(screenDragPull(0)).toBe(0);
    expect(screenDragPull(88, 44)).toBe(1);
  });
});