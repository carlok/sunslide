/** Standard vs colour-blind-friendly (deuteranopia/protanopia) tints. */
import { PALETTE as PALETTE_STANDARD } from './constants.js';

export { PALETTE_STANDARD };

/** Island floor hues — blue / orange alternation instead of green-heavy. */
export const PALETTE_COLOR_BLIND = [
  '#5aa8e8', '#6eb8f0', '#4a9fd4', '#3d8fc8', '#7ec0ff',
  '#e8a04a', '#f0b05a', '#d89038', '#c88030', '#ffb86a',
  '#5eb0ff', '#ffaa44', '#88c8f8', '#ff9a3c', '#6aaee0',
];

export const THEME_HIGHLIGHTS = {
  standard: { hi: '#ffcc55', hiDark: '#4a5cff', bloom: '#ff9ccf', mapEligLit: 'rgba(255,210,94,' },
  colorBlind: { hi: '#ffaa44', hiDark: '#5eb0ff', bloom: '#ffc77a', mapEligLit: 'rgba(255,170,68,' },
};

/**
 * Bubble look. The seed is a hot pink that sits far (ΔE ≥ 40) from every island colour in both
 * palettes and from the warm accents around it (slide glow, home walls, lamps, floor specks); the
 * shell rim is inked dark by day so the outline also reads on pale floors.
 */
export const BUBBLE_COLORS = {
  seed: '#ff1f8f',
  seedEmissive: '#ff0a6a',
  rimInk: '#0a1029',
};

/** Speck colours painted on island floors (kept away from the bubble seed). */
export const FLOOR_SPECKS = ['#ffffff', '#ffd0e6'];

export function highlightTheme(colorBlind) {
  return colorBlind ? THEME_HIGHLIGHTS.colorBlind : THEME_HIGHLIGHTS.standard;
}

export function paletteForMode(colorBlind) {
  return colorBlind ? PALETTE_COLOR_BLIND : PALETTE_STANDARD;
}