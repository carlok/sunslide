import { describe, expect, it } from 'vitest';
import {
  AUTO_QUALITY,
  createAutoQuality,
  judgeWindow,
  pauseAutoQuality,
  restartAutoQuality,
  tickAutoQuality,
} from '../../src/logic/auto-quality.js';
import { createFrameCadence, observeFrameCadence } from '../../src/logic/frame-cadence.js';

const HZ120 = 1000 / 120;
const HZ60 = 1000 / 60;
const HZ30 = 1000 / 30;

/**
 * rAF intervals of a pipelined, vsync-locked renderer: each frame takes `cost(level, t)` ms of GPU
 * time, is shown at the first vsync after it finishes, and at most one frame is shown per vsync.
 * A 25 ms frame on a 60 Hz panel alternates 33.3 / 16.7 ms intervals, like a real browser.
 */
function vsyncDevice(periodMs, cost) {
  let ready = 0;
  let shown = 0;
  return (level) => {
    ready = Math.max(ready, shown - periodMs) + cost(level, shown);
    const next = Math.max(shown + periodMs, Math.ceil(ready / periodMs - 1e-9) * periodMs);
    const dt = next - shown;
    shown = next;
    return dt;
  };
}

const perTier = (low, medium, high) => (level) => [low, medium, high][level];

/** Run the same loop as perfSample() in 11-quality-sizing-loop.js for `seconds` of gameplay. */
function play({ seconds, display, cost, work = () => 4, level = 2, maxLevel = 2 }) {
  const s = createAutoQuality();
  const cad = createFrameCadence();
  const frameMs = vsyncDevice(display, cost);
  restartAutoQuality(s, 0);
  let t = 0;
  let lvl = level;
  const changes = [];
  const timeAt = [0, 0, 0];
  while (t < seconds * 1000) {
    const ms = frameMs(lvl);
    t += ms;
    timeAt[lvl] += ms;
    const cadenceMs = observeFrameCadence(cad, ms);
    const next = tickAutoQuality(s, {
      nowMs: t,
      frameMs: ms,
      workMs: work(lvl, t),
      cadenceMs,
      level: lvl,
      maxLevel,
    });
    if (next !== lvl) {
      changes.push({ t, to: next });
      lvl = next;
    }
  }
  return { level: lvl, changes, timeAt, s };
}

describe('auto-quality', () => {
  it('60 Hz device with headroom keeps High', () => {
    const r = play({ seconds: 120, display: HZ60, cost: perTier(6, 8, 11) });
    expect(r.changes).toEqual([]);
    expect(r.level).toBe(2);
  });

  it('30 Hz-capped device keeps High (Low Power Mode, Energy Saver, 30 Hz panel)', () => {
    const r = play({ seconds: 120, display: HZ30, cost: perTier(6, 8, 11) });
    expect(r.changes).toEqual([]);
    expect(r.level).toBe(2);
    // Every window averages ~33 ms: the old "mean > 24 ms" rule dropped this device to Low in ~14 s.
    expect(r.s.last.meanMs).toBeGreaterThan(AUTO_QUALITY.slowFrameMs);
    expect(r.s.last.verdict).toBe('good');
  });

  it('30 Hz-capped device that sometimes misses a vsync keeps High', () => {
    let i = 0;
    const r = play({
      seconds: 120,
      display: HZ30,
      cost: () => (++i % 10 === 0 ? 40 : 11),
    });
    expect(r.changes).toEqual([]);
  });

  it('120 Hz panel running at 60 fps keeps High', () => {
    const r = play({ seconds: 120, display: HZ120, cost: perTier(6, 10, 15) });
    expect(r.changes).toEqual([]);
  });

  it('genuinely slow device on a 60 Hz panel drops a tier after the warm-up', () => {
    const r = play({ seconds: 15, display: HZ60, cost: perTier(8, 13, 30) });
    expect(r.changes.length).toBeGreaterThan(0);
    expect(r.changes[0].to).toBe(1);
    expect(r.changes[0].t).toBeGreaterThanOrEqual(AUTO_QUALITY.warmupMs);
    expect(r.changes[0].t).toBeLessThan(10000);
    expect(r.level).toBe(1);
  });

  it('keeps dropping while the lower tier is still slow', () => {
    const r = play({ seconds: 25, display: HZ60, cost: perTier(8, 30, 40) });
    expect(r.changes.map((c) => c.to)).toEqual([1, 0]);
    expect(r.level).toBe(0);
  });

  it('genuinely slow device on a 30 Hz panel still drops', () => {
    const r = play({ seconds: 15, display: HZ30, cost: perTier(15, 25, 48) });
    expect(r.changes[0]?.to).toBe(1);
  });

  it('CPU-bound device pinned at two vsyncs drops (busy, not waiting on the display)', () => {
    const r = play({
      seconds: 15,
      display: HZ60,
      cost: perTier(8, 14, 33),
      work: perTier(6, 10, 28),
    });
    expect(r.changes[0]?.to).toBe(1);
  });

  it('never drops below Low', () => {
    const r = play({ seconds: 30, display: HZ60, cost: () => 40, level: 0 });
    expect(r.changes).toEqual([]);
    expect(r.level).toBe(0);
  });

  it('recovers High after a sustained run of good frames', () => {
    // 20 s of heavy load (say, another tab hogging the GPU), then the device is fine again.
    const heavy = perTier(8, 13, 30);
    const light = perTier(6, 8, 11);
    const r = play({
      seconds: 120,
      display: HZ60,
      cost: (level, t) => (t < 20000 ? heavy(level) : light(level)),
    });
    expect(r.changes.map((c) => c.to)).toEqual([1, 2]);
    const [down, up] = r.changes;
    expect(up.t - down.t).toBeGreaterThanOrEqual(AUTO_QUALITY.warmupMs + AUTO_QUALITY.upAfterMs);
    expect(r.level).toBe(2);
  });

  it('backs off instead of oscillating when High never holds', () => {
    const r = play({ seconds: 15 * 60, display: HZ60, cost: perTier(8, 13, 30) });
    const ups = r.changes.filter((c) => c.to === 2).map((c) => c.t);
    expect(ups.length).toBeGreaterThan(0);
    expect(ups.length).toBeLessThanOrEqual(5);
    for (let i = 2; i < ups.length; i++) {
      expect(ups[i] - ups[i - 1]).toBeGreaterThan(ups[i - 1] - ups[i - 2]);
    }
    // Medium is fine on this device, so it never falls to Low and spends most of the time on Medium.
    expect(r.timeAt[0]).toBe(0);
    expect(r.timeAt[1] / (15 * 60 * 1000)).toBeGreaterThan(0.85);
    expect(r.s.backoff).toBeGreaterThan(0);
  });

  it('respects the session cap (maxLevel)', () => {
    const r = play({ seconds: 120, display: HZ60, cost: perTier(6, 8, 11), level: 1, maxLevel: 1 });
    expect(r.changes).toEqual([]);
    expect(r.level).toBe(1);
  });

  it('does not judge frames during the warm-up after a restart', () => {
    const s = createAutoQuality();
    restartAutoQuality(s, 1000);
    for (let i = 0; i < 200; i++) {
      tickAutoQuality(s, { nowMs: 1000 + i * 10, frameMs: 50, workMs: 45, cadenceMs: HZ60, level: 2, maxLevel: 2 });
    }
    expect(s.n).toBe(0);
    expect(s.last).toBe(null);
  });

  it('pause drops the partial window but keeps the good streak', () => {
    const s = createAutoQuality();
    s.goodMs = 1234;
    for (let i = 0; i < 50; i++) {
      tickAutoQuality(s, { nowMs: i * 17, frameMs: 17, cadenceMs: HZ60, level: 1, maxLevel: 2 });
    }
    expect(s.n).toBe(50);
    pauseAutoQuality(s);
    expect(s.n).toBe(0);
    expect(s.goodMs).toBe(1234);
    restartAutoQuality(s, 0);
    expect(s.goodMs).toBe(0);
  });

  it('skips empty frames and missing CPU timings', () => {
    const s = createAutoQuality();
    expect(tickAutoQuality(s, { nowMs: 0, frameMs: 0, level: 2, maxLevel: 2 })).toBe(2);
    expect(s.n).toBe(0);
    tickAutoQuality(s, { nowMs: 0, frameMs: 16, workMs: undefined, level: 2, maxLevel: 2 });
    tickAutoQuality(s, { nowMs: 0, frameMs: 16, workMs: NaN, level: 2, maxLevel: 2 });
    expect(s.n).toBe(2);
    expect(s.nWork).toBe(0);
  });

  describe('judgeWindow', () => {
    const s = createAutoQuality();

    it('blames the renderer only when behind the display cadence or CPU-bound', () => {
      expect(judgeWindow(s, { meanMs: 33.4, workMs: 5, cadenceMs: HZ30 })).toBe('good');
      expect(judgeWindow(s, { meanMs: 25, workMs: 5, cadenceMs: HZ60 })).toBe('slow');
      expect(judgeWindow(s, { meanMs: 33.4, workMs: 30, cadenceMs: HZ30 })).toBe('slow');
      // Behind the cadence but still fast enough to play: not worth a tier.
      expect(judgeWindow(s, { meanMs: 22, workMs: 5, cadenceMs: HZ60 })).toBe('steady');
    });

    it('needs CPU headroom to call a window good', () => {
      expect(judgeWindow(s, { meanMs: HZ60, workMs: 12, cadenceMs: HZ60 })).toBe('steady');
      expect(judgeWindow(s, { meanMs: HZ60, workMs: null, cadenceMs: HZ60 })).toBe('good');
    });

    it('without a cadence estimate, only CPU saturation counts as slow', () => {
      expect(judgeWindow(s, { meanMs: 33, workMs: 5, cadenceMs: null })).toBe('steady');
      expect(judgeWindow(s, { meanMs: 33, workMs: 30, cadenceMs: null })).toBe('slow');
      expect(judgeWindow(s, { meanMs: 16, workMs: 4, cadenceMs: null })).toBe('good');
    });
  });
});
