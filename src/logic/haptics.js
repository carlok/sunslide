/** Vibration feedback (#38-compatible; gated by sunslide.haptics). */
import { createStore } from './store.js';
import { SETTINGS_KEYS } from './settings.js';

export function hapticsSupported(navigator = globalThis.navigator) {
  return !!(navigator && typeof navigator.vibrate === 'function');
}

export function createHaptics({ navigator, storage, prefix = 'sunslide.' } = {}) {
  const nav = navigator ?? (typeof globalThis.navigator !== 'undefined' ? globalThis.navigator : null);
  const store = createStore(storage, prefix);

  const isEnabled = () => store.get(SETTINGS_KEYS.haptics, true) !== false;

  return {
    isSupported: () => hapticsSupported(nav),
    isEnabled,
    setEnabled(v) {
      store.set(SETTINGS_KEYS.haptics, !!v);
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
      return this.pulse(14);
    },
    bubbleCollect() {
      return this.pulse(10);
    },
  };
}