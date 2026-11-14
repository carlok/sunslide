import { describe, expect, it } from 'vitest';
import { generateMazeWalls } from '../../src/logic/maze.js';
import { N, TW } from '../../src/logic/constants.js';

function seededRng(seed) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

describe('maze generation', () => {
  it('produces connected mazes with matching doorways', () => {
    const walls = generateMazeWalls(seededRng(42));
    expect(walls.length).toBe(N);
    let open = 0;
    for (let i = 0; i < N; i++) {
      const x = i % TW;
      const y = (i / TW) | 0;
      for (let d = 0; d < 4; d++) {
        if (walls[i] & (1 << d)) continue;
        open++;
        const nx = x + [0, 1, 0, -1][d];
        const ny = y + [-1, 0, 1, 0][d];
        if (nx >= 0 && nx < TW && ny >= 0 && ny < 4) {
          const j = ny * TW + nx;
          expect(walls[j] & (1 << ((d + 2) & 3))).toBe(0);
        }
      }
    }
    expect(open).toBeGreaterThan(10);
  });

  it('is stable for a fixed seed', () => {
    const a = generateMazeWalls(seededRng(99));
    const b = generateMazeWalls(seededRng(99));
    expect([...a]).toEqual([...b]);
  });
});