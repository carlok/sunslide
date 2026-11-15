/** Vibration feedback (feature-detected; respects future settings). */
import { createStore } from './store.js';

export const HAPTICS_STORE_KEY = 'haptics';
export const HAPTIC_TILE_LOCK_MS = 14;
export const HAPTIC_BUBBLE_MS = 10;

export function hapticsSupported(navigator) {
  const nav = navigator ?? (typeof globalThis.navigator !== 'undefined' ? globalThis.navigator : null);
  return !!(nav && typeof nav.vibrate === 'function');
}

export function createHaptics({ navigator, storage, prefix = 'sunslide.' } = {}) {
  const nav = navigator ?? (typeof globalThis.navigator !== 'undefined' ? globalThis.navigator : null);
  const store = createStore(storage, prefix);

  const isEnabled = () => store.get(HAPTICS_STORE_KEY, true) !== false;

  return {
    isSupported: () => hapticsSupported(nav),
    isEnabled,
    setEnabled(v) {
      store.set(HAPTICS_STORE_KEY, !!v);
    },
    pulse(ms) {
      if (!isEnabled() || !hapticsSupported(nav)) return false;
      const n = Number(ms);
      if (!Number.isFinite(n) || n <= 0) return false;
      try {
        return !!nav.vibrate(n);
      } catch {
        return false;
      }
    },
    tileLock() {
      return this.pulse(HAPTIC_TILE_LOCK_MS);
    },
    bubbleCollect() {
      return this.pulse(HAPTIC_BUBBLE_MS);
    },
  };
}