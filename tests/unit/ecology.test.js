import { describe, expect, it } from 'vitest';
import { CW, CH } from '../../src/logic/constants.js';
import {
  ECOLOGY,
  CELL_TANGENT,
  DECOR_LIMITS,
  cellFootprintTangent,
  cellKey,
  clearEcology,
  createEcologyState,
  decorInsideCell,
  ecologyCount,
  ecologyGrowFactor,
  ecologyPatchColor,
  ecologyPatchRgb,
  markBubbleCollected,
  planCellDecor,
} from '../../src/logic/ecology.js';

describe('ecology', () => {
  it('marks a cell once per bubble pop', () => {
    const s = createEcologyState();
    expect(markBubbleCollected(s, 2, 3, 1, 0)).toBe(true);
    expect(ecologyCount(s)).toBe(1);
    expect(markBubbleCollected(s, 2, 3, 1, 0)).toBe(false);
    expect(ecologyCount(s)).toBe(1);
  });

  it('uses stable seeded decor per cell', () => {
    const a = planCellDecor(4, 2, 5);
    const b = planCellDecor(4, 2, 5);
    expect(a).toEqual(b);
    expect(a.length).toBeGreaterThan(0);
    expect(a.length).toBeLessThanOrEqual(ECOLOGY.maxDecorPerCell);
  });

  it('clears on restart', () => {
    const s = createEcologyState();
    markBubbleCollected(s, 0, 0, 0);
    markBubbleCollected(s, 1, 4, 2);
    clearEcology(s);
    expect(ecologyCount(s)).toBe(0);
    expect(s.decorTotal).toBe(0);
  });

  it('cell keys are unique per tile coordinate', () => {
    expect(cellKey(1, 2, 3)).not.toBe(cellKey(2, 2, 3));
    expect(cellKey(1, 2, 3)).not.toBe(cellKey(1, 3, 3));
  });

  it('patch footprint matches one maze cell in tangent units', () => {
    const fp = cellFootprintTangent();
    expect(fp.sx).toBeCloseTo(CW * 0.94, 6);
    expect(fp.sz).toBeCloseTo(CH * 0.94, 6);
    expect(fp.sx).toBeLessThan(CW * 1.02);
    expect(fp.sz).toBeLessThan(CH * 1.02);
    expect(CELL_TANGENT.sx).toBeCloseTo(fp.sx);
    expect(fp.thick).toBeLessThan(0.01);
  });

  it('patch colors vary per cell but stay stable and meadow-green', () => {
    const a = ecologyPatchRgb(2, 3, 1);
    const b = ecologyPatchRgb(2, 3, 1);
    const c = ecologyPatchRgb(2, 4, 1);
    expect(a).toEqual(b);
    expect(a.g).toBeGreaterThan(a.r);
    expect(a.g).toBeGreaterThan(a.b);
    expect(c).not.toEqual(a);
    const hsl = ecologyPatchColor(2, 3, 1);
    expect(hsl.h).toBeGreaterThan(0.2);
    expect(hsl.h).toBeLessThan(0.45);
  });

  it('patch shades span a visible range, stay green and never go dark', () => {
    let minL = 1;
    let maxL = 0;
    for (let t = 0; t < 15; t++) {
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 4; y++) {
          const { l } = ecologyPatchColor(t, x, y);
          const rgb = ecologyPatchRgb(t, x, y);
          minL = Math.min(minL, l);
          maxL = Math.max(maxL, l);
          expect(rgb.g).toBeGreaterThan(rgb.r);
          expect(rgb.g).toBeGreaterThan(rgb.b);
        }
      }
    }
    expect(minL).toBeGreaterThanOrEqual(0.25);
    expect(maxL - minL).toBeGreaterThan(0.12);
  });

  it('grow factor eases in over growSeconds', () => {
    expect(ecologyGrowFactor(0)).toBe(0);
    expect(ecologyGrowFactor(ECOLOGY.growSeconds)).toBe(1);
    expect(ecologyGrowFactor(ECOLOGY.growSeconds * 0.5)).toBeGreaterThan(0.4);
    expect(ecologyGrowFactor(ECOLOGY.growSeconds * 0.5)).toBeLessThan(0.7);
  });

  it('planned decor stays inside the cell with low height', () => {
    for (let t = 0; t < 8; t++) {
      for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 4; y++) {
          for (const d of planCellDecor(t, x, y)) {
            expect(decorInsideCell(d)).toBe(true);
          }
        }
      }
    }
    expect(DECOR_LIMITS.maxHeight).toBeLessThanOrEqual(0.04);
  });
});