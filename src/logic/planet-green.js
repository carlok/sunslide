/** Planet greening progress — bubble cells turned permanent ecology. */
import { isBubbleDot } from './bubbles.js';

/** Count initial bubble dots (plain and prism) on all tiles (optional for tests / tooling). */
export function countBubbleDotsOnTiles(tiles, tw, nCells) {
  let count = 0;
  if (!tiles?.length) return 0;
  for (const T of tiles) {
    const dots = T.dots;
    if (!dots) continue;
    for (let i = 0; i < nCells; i++) {
      if (isBubbleDot(dots[i])) count += 1;
    }
  }
  return count;
}

/** Integer percent 0–100; `target` is bubble cells that can green this sector. */
export function planetGreenPercent(greenCount, target) {
  const g = Math.max(0, Math.floor(Number(greenCount)) || 0);
  const t = Math.max(0, Math.floor(Number(target)) || 0);
  if (t <= 0) return g > 0 ? 100 : 0;
  return Math.min(100, Math.round((g * 100) / t));
}

export function isPlanetFullyGreen(greenCount, target) {
  const t = Math.max(0, Math.floor(Number(target)) || 0);
  if (t <= 0) return false;
  return Math.max(0, Math.floor(Number(greenCount)) || 0) >= t;
}

export function formatGreenPercent(pct) {
  const p = Math.min(100, Math.max(0, Math.round(Number(pct)) || 0));
  return `${p}%`;
}