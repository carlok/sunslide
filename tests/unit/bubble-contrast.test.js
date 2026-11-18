import { describe, expect, it } from 'vitest';
import {
  contrastRatio,
  deltaE,
  hexToLab,
  minDeltaE,
  relativeLuminance,
} from '../../src/logic/color-contrast.js';
import {
  BUBBLE_COLORS,
  FLOOR_SPECKS,
  PALETTE_COLOR_BLIND,
  PALETTE_STANDARD,
  THEME_HIGHLIGHTS,
} from '../../src/logic/visual-theme.js';

// Warm accents that sit next to bubbles in the renderer (frags 05/06): home walls, lamps, home banners.
const WARM_ACCENTS = ['#ffd477', '#fff3cf', '#ffd25e'];
const BERRY = '#ff4fd8';

function surroundings(palette, theme) {
  return [...palette, theme.hi, theme.hiDark, ...FLOOR_SPECKS, ...WARM_ACCENTS];
}

describe('colour helpers', () => {
  it('computes WCAG luminance and contrast', () => {
    expect(relativeLuminance('#000')).toBe(0);
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1, 10);
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 6);
    expect(contrastRatio('#777777', '#777777')).toBe(1);
  });

  it('computes CIELAB and ΔE76', () => {
    const white = hexToLab('#ffffff');
    expect(white[0]).toBeCloseTo(100, 1);
    expect(Math.abs(white[1])).toBeLessThan(0.5);
    expect(deltaE('#123456', '#123456')).toBe(0);
    expect(deltaE('#000000', '#ffffff')).toBeCloseTo(100, 1);
    expect(minDeltaE('#000000', ['#ffffff', '#010101'])).toBeLessThan(1);
  });
});

describe('bubble seed stands out from the ground', () => {
  it('is far from every island and accent colour in the standard palette', () => {
    expect(minDeltaE(BUBBLE_COLORS.seed, surroundings(PALETTE_STANDARD, THEME_HIGHLIGHTS.standard))).toBeGreaterThanOrEqual(40);
  });

  it('is far from every island and accent colour in the colour-blind palette', () => {
    expect(minDeltaE(BUBBLE_COLORS.seed, surroundings(PALETTE_COLOR_BLIND, THEME_HIGHLIGHTS.colorBlind))).toBeGreaterThanOrEqual(40);
  });

  it('does not read as the berry', () => {
    expect(deltaE(BUBBLE_COLORS.seed, BERRY)).toBeGreaterThanOrEqual(25);
  });

  it('contrasts with the daylight rim ink', () => {
    expect(contrastRatio(BUBBLE_COLORS.seed, BUBBLE_COLORS.rimInk)).toBeGreaterThanOrEqual(4.5);
  });

  it('fixes the old yellow seed, which sat next to the slide glow and islands 6–8', () => {
    const old = '#ffd36b';
    expect(minDeltaE(old, surroundings(PALETTE_STANDARD, THEME_HIGHLIGHTS.standard))).toBeLessThan(15);
  });
});
