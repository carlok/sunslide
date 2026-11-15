import { describe, expect, it } from 'vitest';
import {
  ambientLayerGains,
  ambientTier,
  layerFade,
  AMBIENT_THRESHOLDS,
} from '../../src/logic/ambient-green.js';
import { planetGreenPercent } from '../../src/logic/planet-green.js';

describe('ambient-green', () => {
  it('fades each layer at documented thresholds', () => {
    expect(ambientLayerGains(0)).toEqual({ drone: 1, pad: 0, birds: 0, melody: 0 });
    expect(ambientLayerGains(24).pad).toBe(0);
    expect(ambientLayerGains(25).pad).toBe(0);
    expect(ambientLayerGains(30).pad).toBeGreaterThan(0);
    expect(ambientLayerGains(50).birds).toBe(0);
    expect(ambientLayerGains(55).birds).toBeGreaterThan(0);
    expect(ambientLayerGains(75).melody).toBe(0);
    expect(ambientLayerGains(80).melody).toBeGreaterThan(0);
    expect(AMBIENT_THRESHOLDS.pad).toBe(25);
  });

  it('reports ambient tier', () => {
    expect(ambientTier(0)).toBe(1);
    expect(ambientTier(30)).toBe(2);
    expect(ambientTier(60)).toBe(3);
    expect(ambientTier(90)).toBe(4);
  });

  it('pairs with planet green percent', () => {
    const pct = planetGreenPercent(25, 100);
    expect(pct).toBe(25);
    expect(layerFade(pct, 25, 40)).toBe(0);
    expect(ambientTier(pct)).toBe(1);
  });
});