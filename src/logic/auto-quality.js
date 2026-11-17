/**
 * Auto quality tier controller (0 Low, 1 Medium, 2 High).
 *
 * Every `windowFrames` gameplay frames it judges the window:
 * - slow: the mean frame is visibly slow (> slowFrameMs) AND the renderer is to blame, meaning
 *   frames run behind the display cadence (frame-cadence.js) or CPU-side work fills most of the
 *   frame. Steps down one tier.
 * - good: frames keep pace with the display (or run under goodFrameMs) with CPU to spare.
 *   After upAfterMs of consecutive good windows, steps up one tier.
 * - steady: neither. Breaks a good streak.
 *
 * "Visibly slow" alone is not enough: on a 30 Hz panel, iOS Low Power Mode or Chrome Energy Saver,
 * rAF fires every ~33 ms however cheap the frame is, and a plain "mean > 24 ms" rule walks those
 * devices from High to Low and never back.
 *
 * Hysteresis: after any tier change, frames are ignored for warmupMs (shader compiles, texture
 * uploads). A step up that is followed by a drop within probationMs doubles the good streak needed
 * next time (up to 2^maxBackoff), so a device that can't hold the higher tier probes it less and
 * less often instead of oscillating.
 *
 * Pure: time comes in as `nowMs`; the caller applies the returned level.
 */

export const AUTO_QUALITY = {
  windowFrames: 90,
  warmupMs: 4000,
  maxFrameMs: 100, // clamp per-sample so one stall can't decide a window
  slowFrameMs: 24, // window mean above this (under ~42 fps) is visibly slow...
  cadenceSlack: 1.2, // ...and the renderer's fault if the mean also exceeds cadence × this
  busyShare: 0.8, // ...or if CPU work fills this share of the frame (CPU-bound, not vsync-bound)
  goodFrameMs: 18, // a window this fast is good on any display (~55 fps)
  goodSlack: 1.1, // ...as is one within this factor of the display cadence
  goodBusyShare: 0.5, // good windows also need CPU work under this share of the frame
  upAfterMs: 30000, // consecutive good gameplay before trying the next tier up
  probationMs: 20000, // a drop this soon after a step up means the step up didn't hold
  maxBackoff: 4, // upAfterMs doubles per failed step up, at most 2^4 = 16× (8 min)
};

export function createAutoQuality(opts = {}) {
  return {
    ...AUTO_QUALITY,
    ...opts,
    holdUntil: -Infinity,
    n: 0,
    sumFrame: 0,
    sumWork: 0,
    nWork: 0,
    goodMs: 0,
    backoff: 0,
    lastUpAt: -Infinity,
    last: null,
  };
}

function clearWindow(s) {
  s.n = 0;
  s.sumFrame = 0;
  s.sumWork = 0;
  s.nWork = 0;
}

/** New run or quality setting change: let the scene settle before judging, start a fresh streak. */
export function restartAutoQuality(s, nowMs) {
  s.holdUntil = nowMs + s.warmupMs;
  s.goodMs = 0;
  clearWindow(s);
}

/** Paused, menus, non-play states: drop the partial window. A good streak survives a pause. */
export function pauseAutoQuality(s) {
  clearWindow(s);
}

/**
 * @param {{ meanMs: number, workMs: number|null, cadenceMs: number|null }} w
 * @returns {'slow'|'good'|'steady'}
 */
export function judgeWindow(s, { meanMs, workMs, cadenceMs }) {
  const cad = cadenceMs > 0 ? cadenceMs : null;
  const busy = workMs != null ? workMs / meanMs : null;
  const behind = cad != null && meanMs > cad * s.cadenceSlack;
  if (meanMs > s.slowFrameMs && (behind || (busy != null && busy > s.busyShare))) return 'slow';
  const onPace = meanMs <= s.goodFrameMs || (cad != null && meanMs <= cad * s.goodSlack);
  if (onPace && (busy == null || busy <= s.goodBusyShare)) return 'good';
  return 'steady';
}

/**
 * Feed one gameplay frame.
 * @param {{ nowMs: number, frameMs: number, workMs?: number, cadenceMs?: number|null,
 *           level: number, maxLevel: number }} f
 *   frameMs: rAF interval; workMs: CPU time spent on update + render this frame;
 *   cadenceMs: display cadence estimate; maxLevel: highest tier allowed (session cap).
 * @returns {number} the level to use from now on (level - 1, level, or level + 1).
 */
export function tickAutoQuality(s, f) {
  const { nowMs, frameMs, workMs, cadenceMs, level, maxLevel } = f;
  if (nowMs < s.holdUntil || !(frameMs > 0)) return level;
  s.n++;
  s.sumFrame += Math.min(frameMs, s.maxFrameMs);
  if (Number.isFinite(workMs) && workMs >= 0) {
    s.sumWork += Math.min(workMs, s.maxFrameMs);
    s.nWork++;
  }
  if (s.n < s.windowFrames) return level;

  const spanMs = s.sumFrame;
  const win = {
    meanMs: s.sumFrame / s.n,
    workMs: s.nWork ? s.sumWork / s.nWork : null,
    cadenceMs: cadenceMs > 0 ? cadenceMs : null,
  };
  clearWindow(s);
  win.verdict = judgeWindow(s, win);
  s.last = win;

  if (win.verdict === 'slow') {
    s.goodMs = 0;
    if (level <= 0) return level;
    if (nowMs - s.lastUpAt < s.probationMs) s.backoff = Math.min(s.maxBackoff, s.backoff + 1);
    s.lastUpAt = -Infinity;
    s.holdUntil = nowMs + s.warmupMs;
    return level - 1;
  }
  if (win.verdict !== 'good') {
    s.goodMs = 0;
    return level;
  }
  s.goodMs += spanMs;
  if (level >= maxLevel || s.goodMs < s.upAfterMs * 2 ** s.backoff) return level;
  s.goodMs = 0;
  s.lastUpAt = nowMs;
  s.holdUntil = nowMs + s.warmupMs;
  return level + 1;
}
