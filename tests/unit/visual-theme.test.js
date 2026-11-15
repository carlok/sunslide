import { describe, expect, it } from 'vitest';
import {
  PALETTE_COLOR_BLIND,
  PALETTE_STANDARD,
  highlightTheme,
  paletteForMode,
} from '../../src/logic/visual-theme.js';

describe('visual-theme', () => {
  it('switches palette mode', () => {
    expect(paletteForMode(false)).toBe(PALETTE_STANDARD);
    expect(paletteForMode(true)).toBe(PALETTE_COLOR_BLIND);
    expect(PALETTE_COLOR_BLIND.length).toBe(15);
  });

  it('switches highlight colours', () => {
    const std = highlightTheme(false);
    const cb = highlightTheme(true);
    expect(std.hi).not.toBe(cb.hi);
    expect(cb.hiDark).toMatch(/#/);
  });
});