import { describe, expect, it } from 'vitest';
import { mod, wrapD, clamp, hash, smooth } from '../../src/logic/helpers.js';
import { GW } from '../../src/logic/constants.js';

describe('helpers', () => {
  it('mod wraps negatives', () => {
    expect(mod(-1, 32)).toBe(31);
    expect(mod(33, 32)).toBe(1);
  });

  it('wrapD folds east-west distance', () => {
    expect(wrapD(20, GW)).toBe(-12);
    expect(wrapD(-20, GW)).toBe(12);
  });

  it('smooth is 0..1 easing', () => {
    expect(smooth(0)).toBe(0);
    expect(smooth(1)).toBe(1);
    expect(smooth(0.5)).toBe(0.5);
  });

  it('clamp bounds values', () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
  });

  it('hash is deterministic', () => {
    expect(hash(1, 2, 3)).toBe(hash(1, 2, 3));
    expect(hash(1, 2, 3)).toBeGreaterThanOrEqual(0);
    expect(hash(1, 2, 3)).toBeLessThan(1);
  });
});