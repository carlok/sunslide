import { describe, expect, it } from 'vitest';
import { mkActor, stepActor } from '../../src/logic/movement.js';
import { TW } from '../../src/logic/constants.js';

describe('stepActor', () => {
  it('moves one cell when path is open', () => {
    const nbr = (t, x, y, d) =>
      d === 1 && x + 1 < TW ? { t, x: x + 1, y } : null;
    const a = mkActor(0, 0, 0);
    stepActor(a, 0.25, 4, () => 1, null, nbr);
    expect(a).toMatchObject({ x: 1, y: 0, moving: false });
  });
});