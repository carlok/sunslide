import { describe, expect, it } from 'vitest';
import { FLOOR_CANVAS, MEADOW_CANVAS } from '../../src/logic/texture-budget.js';

describe('texture-budget', () => {
  it('keeps floor smaller than meadow', () => {
    expect(FLOOR_CANVAS.width * FLOOR_CANVAS.height).toBeLessThan(
      MEADOW_CANVAS.width * MEADOW_CANVAS.height,
    );
  });
});