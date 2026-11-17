import { describe, expect, it } from 'vitest';
import {
  FRAME_CADENCE,
  createFrameCadence,
  lowPercentile,
  observeFrameCadence,
} from '../../src/logic/frame-cadence.js';

const HZ60 = 1000 / 60;
const HZ30 = 1000 / 30;

function feed(c, intervals) {
  let ms = null;
  for (const v of intervals) ms = observeFrameCadence(c, v);
  return ms;
}

const repeat = (v, n) => Array.from({ length: n }, () => v);

describe('frame-cadence', () => {
  it('has no estimate until minSamples frames', () => {
    const c = createFrameCadence();
    expect(feed(c, repeat(HZ60, FRAME_CADENCE.minSamples - 1))).toBe(null);
    expect(observeFrameCadence(c, HZ60)).toBeCloseTo(HZ60, 5);
  });

  it('reads a 30 Hz cap as ~33 ms', () => {
    const c = createFrameCadence();
    expect(feed(c, repeat(HZ30, 120))).toBeCloseTo(HZ30, 5);
  });

  it('finds the 60 Hz panel period on a device that misses most vsyncs', () => {
    const c = createFrameCadence();
    // 80% of frames take two vsyncs; the 20% that make it still show the panel's period.
    const mix = Array.from({ length: 120 }, (_, i) => (i % 5 === 0 ? HZ60 : 2 * HZ60));
    expect(feed(c, mix)).toBeCloseTo(HZ60, 5);
  });

  it('ignores stalls and junk samples', () => {
    const c = createFrameCadence();
    feed(c, repeat(HZ60, 60));
    const before = c.n;
    feed(c, [0, -5, NaN, FRAME_CADENCE.maxIntervalMs + 1, 5000]);
    expect(c.n).toBe(before);
    expect(c.ms).toBeCloseTo(HZ60, 5);
  });

  it('never reports a cadence slower than ~30 Hz', () => {
    const c = createFrameCadence();
    // A 15 fps renderer is slow, not display-capped.
    expect(feed(c, repeat(1000 / 15, 120))).toBeCloseTo(FRAME_CADENCE.maxCadenceMs, 5);
  });

  it('follows a switch into and out of Low Power Mode', () => {
    const c = createFrameCadence();
    feed(c, repeat(HZ60, 120));
    expect(feed(c, repeat(HZ30, 120))).toBeCloseTo(HZ30, 5);
    expect(feed(c, repeat(HZ60, 120))).toBeCloseTo(HZ60, 5);
  });

  it('lowPercentile picks from the sorted samples', () => {
    expect(lowPercentile([], 0.1)).toBe(null);
    expect(lowPercentile([30, 10, 20], 0)).toBe(10);
    expect(lowPercentile([30, 10, 20], 1)).toBe(30);
    expect(lowPercentile([30, 10, 20], 0.5)).toBe(20);
  });
});
