/**
 * Map planet green % to ambient layer loudness (0–1). Layers stack; smooth ramps applied in audio.
 *
 * - 0%+: wind/drone (`drone`, always on when ambient is running)
 * - 25%+: soft pad (`pad`)
 * - 50%+: birds/chimes (`birds` — sparse events, not continuous gain only)
 * - 75%+: gentle melody (`melody` — sparse events + slight pad lift)
 */
export const AMBIENT_THRESHOLDS = { pad: 25, birds: 50, melody: 75 };

/** Linear fade from `start`% until fully on at `full`%. */
export function layerFade(percent, start, full = start + 15) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  if (p <= start) return 0;
  if (p >= full) return 1;
  return (p - start) / (full - start);
}

export function ambientLayerGains(percent) {
  const p = Math.min(100, Math.max(0, Math.round(Number(percent)) || 0));
  return {
    drone: 1,
    pad: layerFade(p, AMBIENT_THRESHOLDS.pad),
    birds: layerFade(p, AMBIENT_THRESHOLDS.birds),
    melody: layerFade(p, AMBIENT_THRESHOLDS.melody),
  };
}

/** @returns {0|1|2|3|4} highest unlocked tier for UI/tests */
export function ambientTier(percent) {
  const g = ambientLayerGains(percent);
  if (g.melody > 0) return 4;
  if (g.birds > 0) return 3;
  if (g.pad > 0) return 2;
  return 1;
}