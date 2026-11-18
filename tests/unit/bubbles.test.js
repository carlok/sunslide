import { describe, expect, it } from 'vitest';
import {
  DOT_BUBBLE,
  DOT_EMPTY,
  DOT_PRISM,
  DOT_SUNSTONE,
  isBubbleDot,
  prismCountForLevel,
} from '../../src/logic/bubbles.js';
import { bubblePopScore, popScore, prismPopScore } from '../../src/logic/scoring.js';
import { countBubbleDotsOnTiles } from '../../src/logic/planet-green.js';

describe('bubble kinds', () => {
  it('treats plain and prism bubbles as bubbles, not sunstones or empty cells', () => {
    expect(isBubbleDot(DOT_BUBBLE)).toBe(true);
    expect(isBubbleDot(DOT_PRISM)).toBe(true);
    expect(isBubbleDot(DOT_SUNSTONE)).toBe(false);
    expect(isBubbleDot(DOT_EMPTY)).toBe(false);
  });

  it('places a few prism bubbles per sector, growing slowly and capped', () => {
    expect(prismCountForLevel(1)).toBe(2);
    expect(prismCountForLevel(2)).toBe(3);
    expect(prismCountForLevel(4)).toBe(4);
    expect(prismCountForLevel(40)).toBe(6);
    expect(prismCountForLevel(0)).toBe(2);
    expect(prismCountForLevel('x')).toBe(2);
  });

  it('counts prism bubbles toward the green target', () => {
    const tiles = [{ dots: Uint8Array.from([1, 3, 2, 0]) }, { dots: Uint8Array.from([3, 0, 0, 1]) }];
    expect(countBubbleDotsOnTiles(tiles, 4, 4)).toBe(4);
  });
});

describe('prism scoring', () => {
  it('is worth five plain bubbles at the start of a combo', () => {
    expect(prismPopScore(1)).toBe(50);
    expect(prismPopScore(1)).toBe(5 * bubblePopScore(1));
  });

  it('keeps the same combo bonus as plain bubbles', () => {
    expect(prismPopScore(6) - prismPopScore(1)).toBe(bubblePopScore(6) - bubblePopScore(1));
    expect(prismPopScore(50)).toBe(70);
  });

  it('doubles on home islands and picks the tier by cell value', () => {
    expect(popScore(1, 1, false)).toBe(10);
    expect(popScore(1, 1, true)).toBe(20);
    expect(popScore(3, 1, false)).toBe(50);
    expect(popScore(3, 11, true)).toBe(140);
  });
});
