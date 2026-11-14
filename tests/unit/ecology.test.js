import { describe, expect, it } from 'vitest';
import {
  ECOLOGY,
  cellKey,
  clearEcology,
  createEcologyState,
  ecologyCount,
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
});