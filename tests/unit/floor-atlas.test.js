import { describe, expect, it } from 'vitest';
import {
  atlasGridForCount,
  atlasRectForTile,
  mapUvToAtlas,
} from '../../src/logic/floor-atlas.js';

describe('floor-atlas', () => {
  it('uses a tight grid for 15 tiles', () => {
    expect(atlasGridForCount(15)).toEqual({ cols: 4, rows: 4 });
  });

  it('returns non-overlapping UV rects', () => {
    const { cols, rows } = atlasGridForCount(15);
    const a = atlasRectForTile(0, cols, rows);
    const b = atlasRectForTile(1, cols, rows);
    expect(a.u1).toBeLessThanOrEqual(b.u0 + 1e-6);
    expect(mapUvToAtlas(0.5, 0.5, a).u).toBeGreaterThan(a.u0);
    expect(mapUvToAtlas(0.5, 0.5, a).u).toBeLessThan(a.u1);
  });
});