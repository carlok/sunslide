import { describe, expect, it } from 'vitest';
import { lightAt, lightSlot, canSlideAtSlot } from '../../src/logic/light.js';
import {
  findHole,
  holeNeighbors,
  slideInstant,
  isHome,
  slotDist,
  tilePos,
  liftOf,
} from '../../src/logic/slots.js';
import { COLS, ROWS } from '../../src/logic/constants.js';

describe('light', () => {
  it('varies with sun longitude', () => {
    const a = lightAt(16, 8, 0);
    const b = lightAt(16, 8, Math.PI);
    expect(a).not.toBe(b);
    expect(a).toBeGreaterThanOrEqual(0);
    expect(a).toBeLessThanOrEqual(1);
  });

  it('slot light matches grid helper', () => {
    expect(lightSlot(1, 1, 0)).toBe(lightAt(12, 6, 0));
  });

  it('slide threshold uses CFG.slideLight', () => {
    expect(canSlideAtSlot(0, 0, Math.PI)).toBe(false);
    expect(canSlideAtSlot(0, 0, 0)).toBe(true);
  });
});

describe('slots', () => {
  it('finds hole and neighbors', () => {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(0));
    grid[3][3] = -1;
    expect(findHole(grid)).toEqual({ c: 3, r: 3 });
    expect(holeNeighbors(grid).length).toBeGreaterThan(0);
  });

  it('slideInstant swaps tile into hole', () => {
    const tiles = [
      { id: 0, slot: { c: 0, r: 0 } },
      { id: 1, slot: { c: 1, r: 0 } },
    ];
    const grid = [
      [0, 1],
      [2, -1],
    ];
    slideInstant(grid, tiles, 1, 0);
    expect(grid[1][1]).toBe(1);
    expect(grid[0][1]).toBe(-1);
    expect(tiles[1].slot).toEqual({ c: 1, r: 1 });
  });

  it('isHome detects reading-order slot', () => {
    expect(isHome({ id: 5, anim: null, slot: { c: 1, r: 1 } })).toBe(true);
    expect(isHome({ id: 5, anim: null, slot: { c: 0, r: 0 } })).toBe(false);
  });

  it('slotDist wraps east-west', () => {
    expect(slotDist({ c: 0, r: 0 }, { c: 3, r: 0 })).toBe(1);
  });

  it('tilePos interpolates slide animation', () => {
    const T = {
      slot: { c: 0, r: 0 },
      anim: { fc: 0, fr: 0, dc: 1, dr: 0, t: 0.5 },
    };
    const p = tilePos(T);
    expect(p.x).toBeGreaterThan(0);
    expect(p.x).toBeLessThan(8);
    expect(liftOf(T)).toBeGreaterThan(0);
  });
});