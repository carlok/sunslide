/** Cell values in `tile.dots`, and the rare "prism" bubble tier. */

export const DOT_EMPTY = 0;
export const DOT_BUBBLE = 1;
export const DOT_SUNSTONE = 2;
export const DOT_PRISM = 3;

/** Bubbles (plain or prism) green the planet and count toward par; sunstones don't. */
export function isBubbleDot(v) {
  return v === DOT_BUBBLE || v === DOT_PRISM;
}

/** Prism bubbles per sector: 2 in sector 1, one more every two sectors, at most 6. */
export function prismCountForLevel(level) {
  const l = Math.max(1, Math.floor(Number(level)) || 1);
  return Math.min(6, 2 + Math.floor(l / 2));
}
