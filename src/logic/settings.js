/** User preferences persisted under sunslide.* */
import { createStore } from './store.js';

export const SETTINGS_KEYS = {
  muted: 'muted',
  music: 'music',
  haptics: 'haptics',
  quality: 'quality',
  reducedMotion: 'reducedMotion',
  colorBlind: 'colorBlind',
};

const QUALITY_MODES = new Set(['auto', 0, 1, 2]);

export function normalizeQuality(q) {
  if (QUALITY_MODES.has(q)) return q;
  return 'auto';
}

/** `null` | `'system'` = follow OS; boolean overrides. */
export function parseReducedMotionPref(raw) {
  if (raw === true || raw === 'on') return true;
  if (raw === false || raw === 'off') return false;
  return null;
}

export function resolveReducedMotion(override, systemPrefersReduced = false) {
  const mode = parseReducedMotionPref(override);
  if (mode === true) return true;
  if (mode === false) return false;
  return !!systemPrefersReduced;
}

export function settingsFromStore(store = createStore()) {
  const muted = store.get(SETTINGS_KEYS.muted, false);
  return {
    sound: !muted,
    music: store.get(SETTINGS_KEYS.music, true) !== false,
    haptics: store.get(SETTINGS_KEYS.haptics, true) !== false,
    quality: normalizeQuality(store.get(SETTINGS_KEYS.quality, 'auto')),
    reducedMotion: parseReducedMotionPref(store.get(SETTINGS_KEYS.reducedMotion, null)),
    colorBlind: store.get(SETTINGS_KEYS.colorBlind, false) === true,
  };
}

export function writeSettings(store, patch) {
  if (patch.sound !== undefined) store.set(SETTINGS_KEYS.muted, !patch.sound);
  if (patch.music !== undefined) store.set(SETTINGS_KEYS.music, !!patch.music);
  if (patch.haptics !== undefined) store.set(SETTINGS_KEYS.haptics, !!patch.haptics);
  if (patch.quality !== undefined) store.set(SETTINGS_KEYS.quality, normalizeQuality(patch.quality));
  if (patch.reducedMotion !== undefined) {
    const v = patch.reducedMotion;
    if (v === null) store.set(SETTINGS_KEYS.reducedMotion, null);
    else store.set(SETTINGS_KEYS.reducedMotion, !!v);
  }
  if (patch.colorBlind !== undefined) store.set(SETTINGS_KEYS.colorBlind, !!patch.colorBlind);
  return settingsFromStore(store);
}