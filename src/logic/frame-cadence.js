/**
 * Display frame cadence: how often the browser delivers rAF callbacks when the renderer keeps up.
 *
 * A 60 Hz panel gives ~16.7 ms, but 30 Hz displays, iOS Low Power Mode and Chrome Energy Saver give
 * ~33 ms however cheap the frame is. Quality heuristics compare frame times against this cadence
 * instead of assuming 60 Hz.
 *
 * Estimate: a low percentile of recent intervals. Presentation is vsync-locked, so a device that
 * misses most vsyncs still lands some frames on the panel's real period, while a capped display
 * never delivers anything faster than its cap. The estimate is clamped to ~30 Hz: no common
 * throttle is slower, so frames longer than that are the renderer's fault, not the display's.
 */

export const FRAME_CADENCE = {
  size: 120, // ring of recent intervals (2 s at 60 Hz, 4 s at 30 Hz)
  minSamples: 30, // no estimate before this many
  percentile: 0.1,
  recalcEvery: 15, // re-sort this often; 120 floats is cheap but not free at 60 fps
  maxIntervalMs: 250, // longer gaps are stalls (resume, GC, tab switch), not cadence
  maxCadenceMs: 1000 / 29, // slowest plausible display cadence (30 Hz plus timer jitter)
};

/** Value at fraction `p` (0..1) of the sorted samples; null when empty. */
export function lowPercentile(values, p) {
  if (!values.length) return null;
  const sorted = Array.from(values).sort((a, b) => a - b);
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)));
  return sorted[i];
}

export function createFrameCadence(opts = {}) {
  const o = { ...FRAME_CADENCE, ...opts };
  return { ...o, buf: new Float64Array(o.size), n: 0, i: 0, sinceCalc: 0, ms: null };
}

/** Feed one rAF interval. Returns the cadence estimate in ms, or null while warming up. */
export function observeFrameCadence(c, intervalMs) {
  if (!(intervalMs > 0) || intervalMs > c.maxIntervalMs) return c.ms;
  c.buf[c.i] = intervalMs;
  c.i = (c.i + 1) % c.size;
  if (c.n < c.size) c.n++;
  if (c.n < c.minSamples) return c.ms;
  if (c.ms === null || ++c.sinceCalc >= c.recalcEvery) {
    c.sinceCalc = 0;
    c.ms = Math.min(c.maxCadenceMs, lowPercentile(c.buf.subarray(0, c.n), c.percentile));
  }
  return c.ms;
}
