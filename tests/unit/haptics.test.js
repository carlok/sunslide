import { describe, expect, it, vi } from 'vitest';
import {
  HAPTIC_BUBBLE_MS,
  HAPTIC_TILE_LOCK_MS,
  createHaptics,
  hapticsSupported,
} from '../../src/logic/haptics.js';

describe('haptics', () => {
  it('detects vibrate support', () => {
    expect(hapticsSupported({ vibrate: () => true })).toBe(true);
    expect(hapticsSupported({})).toBe(false);
    expect(hapticsSupported(null)).toBe(false);
  });

  it('pulses when enabled', () => {
    const vibrate = vi.fn(() => true);
    const bag = {};
    const storage = {
      getItem: (k) => (k in bag ? bag[k] : null),
      setItem: (k, v) => {
        bag[k] = v;
      },
    };
    const h = createHaptics({ navigator: { vibrate }, storage });
    expect(h.tileLock()).toBe(true);
    expect(vibrate).toHaveBeenCalledWith(HAPTIC_TILE_LOCK_MS);
    h.bubbleCollect();
    expect(vibrate).toHaveBeenLastCalledWith(HAPTIC_BUBBLE_MS);
  });

  it('respects enabled flag', () => {
    const vibrate = vi.fn(() => true);
    const bag = {};
    const storage = {
      getItem: (k) => (k in bag ? bag[k] : null),
      setItem: (k, v) => {
        bag[k] = v;
      },
    };
    const h = createHaptics({ navigator: { vibrate }, storage });
    expect(h.pulse(10)).toBe(true);
    h.setEnabled(false);
    expect(h.pulse(10)).toBe(false);
    expect(vibrate).toHaveBeenCalledTimes(1);
  });

  it('no-ops when disabled or unsupported', () => {
    const vibrate = vi.fn();
    const bag = {};
    const storage = {
      getItem: (k) => (k in bag ? bag[k] : null),
      setItem: (k, v) => {
        bag[k] = v;
      },
    };
    const h = createHaptics({ navigator: { vibrate }, storage });
    h.setEnabled(false);
    expect(h.pulse(20)).toBe(false);
    expect(vibrate).not.toHaveBeenCalled();
    const h2 = createHaptics({ navigator: {} });
    expect(h2.tileLock()).toBe(false);
  });
});