import { describe, expect, it } from 'vitest';
import {
  countBubbleDotsOnTiles,
  planetGreenPercent,
  isPlanetFullyGreen,
  formatGreenPercent,
} from '../../src/logic/planet-green.js';

describe('planet-green', () => {
  it('counts only bubble dots (value 1)', () => {
    const tiles = [
      { dots: Uint8Array.from([1, 0, 2, 1]) },
      { dots: Uint8Array.from([0, 0, 0, 0]) },
    ];
    expect(countBubbleDotsOnTiles(tiles, 2, 4)).toBe(2);
    expect(countBubbleDotsOnTiles(null, 8, 32)).toBe(0);
  });

  it('computes percent toward bubble target', () => {
    expect(planetGreenPercent(0, 100)).toBe(0);
    expect(planetGreenPercent(25, 100)).toBe(25);
    expect(planetGreenPercent(100, 100)).toBe(100);
    expect(planetGreenPercent(120, 100)).toBe(100);
    expect(planetGreenPercent(3, 0)).toBe(100);
    expect(planetGreenPercent(0, 0)).toBe(0);
  });

  it('detects fully green sector', () => {
    expect(isPlanetFullyGreen(99, 100)).toBe(false);
    expect(isPlanetFullyGreen(100, 100)).toBe(true);
    expect(isPlanetFullyGreen(0, 0)).toBe(false);
  });

  it('formats percent label', () => {
    expect(formatGreenPercent(42.4)).toBe('42%');
    expect(formatGreenPercent(100)).toBe('100%');
  });
});