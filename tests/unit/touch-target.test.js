import { describe, expect, it } from 'vitest';
import { MIN_TOUCH_CSS_PX, meetsTouchTargetSize } from '../../src/logic/touch-target.js';

describe('touch-target', () => {
  it('requires 44×44 by default', () => {
    expect(meetsTouchTargetSize(44, 44)).toBe(true);
    expect(meetsTouchTargetSize(43, 44)).toBe(false);
    expect(meetsTouchTargetSize(44, 38)).toBe(false);
    expect(MIN_TOUCH_CSS_PX).toBe(44);
  });
});