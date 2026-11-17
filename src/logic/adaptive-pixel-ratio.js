/** Pure adaptive DPR policy: cap device ratio, step down/up with hysteresis. */

export const DEFAULT_ADAPTIVE = {
  dprCap: 2,
  dprFloor: 1,
  dprStep: 0.25,
  targetFps: 45,
  recoverFps: 52,
  lowHoldMs: 3000,
  highHoldMs: 5000,
  // Frames within this factor of the display cadence keep pace, whatever their fps: a 30 Hz panel,
  // iOS Low Power Mode or Chrome Energy Saver deliver ~33 ms frames however cheap the frame is.
  cadenceSlack: 1.2,
  // A step down this soon after a step up means the step up didn't hold: double highHoldMs.
  probationMs: 10000,
  maxHighHoldMs: 60000,
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
    cadenceSlack: o.cadenceSlack,
    probationMs: o.probationMs,
    maxHighHoldMs: o.maxHighHoldMs,
    current: cap,
    lowAccum: 0,
    highAccum: 0,
    sinceUpMs: Infinity,
  };
}

export function syncAdaptiveCap(state, deviceDpr, cap = DEFAULT_ADAPTIVE.dprCap) {
  state.cap = capDevicePixelRatio(deviceDpr, cap);
  state.current = Math.min(state.current, state.cap);
  if (state.current < state.floor) state.current = state.floor;
}

/**
 * @param {number} frameMs rAF interval for this frame.
 * @param {number|null} [cadenceMs] display cadence (frame-cadence.js). Without it, fps thresholds
 *   alone decide, which reads every capped 30 Hz display as slow.
 * @returns {boolean} true when `current` changed (caller should resize).
 */
export function tickAdaptiveDpr(state, frameMs, cadenceMs) {
  const dt = Math.max(0, frameMs);
  const fps = 1000 / Math.max(dt, 0.001);
  const onPace = cadenceMs > 0 && dt <= cadenceMs * state.cadenceSlack;
  state.sinceUpMs += dt;
  let changed = false;
  if (fps < state.targetFps && !onPace) {
    state.lowAccum += dt;
    state.highAccum = 0;
    if (state.lowAccum >= state.lowHoldMs && state.current > state.floor + 1e-6) {
      state.current = Math.max(
        state.floor,
        Math.round((state.current - state.step) * 1000) / 1000,
      );
      state.lowAccum = 0;
      if (state.sinceUpMs < state.probationMs) {
        state.highHoldMs = Math.min(state.maxHighHoldMs, state.highHoldMs * 2);
      }
      state.sinceUpMs = Infinity;
      changed = true;
    }
  } else if (fps >= state.recoverFps || onPace) {
    state.highAccum += dt;
    state.lowAccum = 0;
    if (state.highAccum >= state.highHoldMs && state.current < state.cap - 1e-6) {
      state.current = Math.min(
        state.cap,
        Math.round((state.current + state.step) * 1000) / 1000,
      );
      state.highAccum = 0;
      state.sinceUpMs = 0;
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
