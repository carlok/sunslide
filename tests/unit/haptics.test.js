import { describe, expect, it, vi } from 'vitest';
import { createHaptics, hapticsSupported } from '../../src/logic/haptics.js';

describe('haptics', () => {
  it('detects support', () => {
    expect(hapticsSupported({ vibrate: () => true })).toBe(true);
    expect(hapticsSupported({})).toBe(false);
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
});