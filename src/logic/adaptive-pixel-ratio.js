/** Pure adaptive DPR policy: cap device ratio, step down/up with hysteresis. */

export const DEFAULT_ADAPTIVE = {
  dprCap: 2,
  dprFloor: 1,
  dprStep: 0.25,
  targetFps: 45,
  recoverFps: 52,
  lowHoldMs: 3000,
  highHoldMs: 5000,
};

export function capDevicePixelRatio(deviceDpr, cap = DEFAULT_ADAPTIVE.dprCap) {
  const d = Number(deviceDpr);
  const n = Number.isFinite(d) && d > 0 ? d : 1;
  return Math.min(n, cap);
}

export function createAdaptiveDprState(opts = {}) {
  const o = { ...DEFAULT_ADAPTIVE, ...opts };
  const cap = capDevicePixelRatio(o.deviceDpr ?? o.dprCap, o.dprCap);
  return {
    cap,
    floor: o.dprFloor,
    step: o.dprStep,
    targetFps: o.targetFps,
    recoverFps: o.recoverFps,
    lowHoldMs: o.lowHoldMs,
    highHoldMs: o.highHoldMs,
    current: cap,
    lowAccum: 0,
    highAccum: 0,
  };
}

export function syncAdaptiveCap(state, deviceDpr, cap = DEFAULT_ADAPTIVE.dprCap) {
  state.cap = capDevicePixelRatio(deviceDpr, cap);
  state.current = Math.min(state.current, state.cap);
  if (state.current < state.floor) state.current = state.floor;
}

/** @returns {boolean} true when `current` changed (caller should resize). */
export function tickAdaptiveDpr(state, frameMs) {
  const dt = Math.max(0, frameMs);
  const fps = 1000 / Math.max(dt, 0.001);
  let changed = false;
  if (fps < state.targetFps) {
    state.lowAccum += dt;
    state.highAccum = 0;
    if (state.lowAccum >= state.lowHoldMs && state.current > state.floor + 1e-6) {
      state.current = Math.max(
        state.floor,
        Math.round((state.current - state.step) * 1000) / 1000,
      );
      state.lowAccum = 0;
      changed = true;
    }
  } else if (fps >= state.recoverFps) {
    state.highAccum += dt;
    state.lowAccum = 0;
    if (state.highAccum >= state.highHoldMs && state.current < state.cap - 1e-6) {
      state.current = Math.min(
        state.cap,
        Math.round((state.current + state.step) * 1000) / 1000,
      );
      state.highAccum = 0;
      changed = true;
    }
  } else {
    state.lowAccum = Math.max(0, state.lowAccum - dt * 0.5);
    state.highAccum = Math.max(0, state.highAccum - dt * 0.5);
  }
  return changed;
}

export function effectivePixelRatio(basePr, state) {
  return Math.min(basePr, state.current);
}