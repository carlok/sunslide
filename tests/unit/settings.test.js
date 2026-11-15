import { describe, expect, it } from 'vitest';
import {
  normalizeQuality,
  parseReducedMotionPref,
  resolveReducedMotion,
  settingsFromStore,
  writeSettings,
} from '../../src/logic/settings.js';
import { createStore } from '../../src/logic/store.js';

function memStore() {
  const bag = {};
  return createStore({
    getItem: (k) => (k in bag ? bag[k] : null),
    setItem: (k, v) => {
      bag[k] = v;
    },
  });
}

describe('settings', () => {
  it('normalizes quality', () => {
    expect(normalizeQuality('auto')).toBe('auto');
    expect(normalizeQuality(2)).toBe(2);
    expect(normalizeQuality('bogus')).toBe('auto');
  });

  it('resolves reduced motion override', () => {
    expect(resolveReducedMotion(null, false)).toBe(false);
    expect(resolveReducedMotion(null, true)).toBe(true);
    expect(resolveReducedMotion(true, false)).toBe(true);
    expect(resolveReducedMotion(false, true)).toBe(false);
    expect(parseReducedMotionPref('system')).toBe(null);
  });

  it('round-trips store', () => {
    const store = memStore();
    writeSettings(store, {
      sound: false,
      music: true,
      haptics: false,
      quality: 1,
      reducedMotion: true,
      colorBlind: true,
    });
    const s = settingsFromStore(store);
    expect(s.sound).toBe(false);
    expect(s.haptics).toBe(false);
    expect(s.quality).toBe(1);
    expect(s.reducedMotion).toBe(true);
    expect(s.colorBlind).toBe(true);
  });
});