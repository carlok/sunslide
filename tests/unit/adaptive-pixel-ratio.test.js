import { describe, expect, it } from 'vitest';
import {
  capDevicePixelRatio,
  createAdaptiveDprState,
  effectivePixelRatio,
  syncAdaptiveCap,
  tickAdaptiveDpr,
} from '../../src/logic/adaptive-pixel-ratio.js';

describe('adaptive-pixel-ratio', () => {
  it('caps device DPR at 2', () => {
    expect(capDevicePixelRatio(3)).toBe(2);
    expect(capDevicePixelRatio(1.5)).toBe(1.5);
    expect(capDevicePixelRatio(0)).toBe(1);
  });

  it('steps down after sustained low FPS', () => {
    const s = createAdaptiveDprState({ deviceDpr: 2, lowHoldMs: 100, dprStep: 0.5 });
    expect(s.current).toBe(2);
    let changed = false;
    for (let i = 0; i < 4; i++) changed = tickAdaptiveDpr(s, 1000 / 30) || changed;
    expect(changed).toBe(true);
    expect(s.current).toBe(1.5);
  });

  it('does not flap in the hysteresis band', () => {
    const s = createAdaptiveDprState({ deviceDpr: 2, lowHoldMs: 50, highHoldMs: 50 });
    tickAdaptiveDpr(s, 1000 / 48);
    tickAdaptiveDpr(s, 1000 / 48);
    expect(s.current).toBe(2);
  });

  it('steps up after sustained recovery FPS', () => {
    const s = createAdaptiveDprState({
      deviceDpr: 2,
      lowHoldMs: 100,
      highHoldMs: 80,
      dprStep: 0.5,
    });
    for (let i = 0; i < 4; i++) tickAdaptiveDpr(s, 1000 / 30);
    expect(s.current).toBe(1.5);
    let up = false;
    for (let i = 0; i < 6; i++) up = tickAdaptiveDpr(s, 1000 / 60) || up;
    expect(up).toBe(true);
    expect(s.current).toBe(2);
  });

  it('effectivePixelRatio respects adaptive ceiling', () => {
    const s = createAdaptiveDprState({ deviceDpr: 2 });
    s.current = 1.25;
    expect(effectivePixelRatio(1.8, s)).toBe(1.25);
    expect(effectivePixelRatio(1.0, s)).toBe(1);
  });

  it('syncAdaptiveCap clamps when device DPR drops', () => {
    const s = createAdaptiveDprState({ deviceDpr: 2 });
    s.current = 2;
    syncAdaptiveCap(s, 1.25);
    expect(s.cap).toBe(1.25);
    expect(s.current).toBe(1.25);
  });

  describe('with a display cadence', () => {
    const HZ30 = 1000 / 30;

    it('keeps full DPR on a 30 Hz-capped display', () => {
      const s = createAdaptiveDprState({ deviceDpr: 2 });
      let changed = false;
      for (let i = 0; i < 600; i++) changed = tickAdaptiveDpr(s, HZ30, HZ30) || changed;
      expect(changed).toBe(false);
      expect(s.current).toBe(2);
    });

    it('still steps down when frames fall behind the cadence', () => {
      const s = createAdaptiveDprState({ deviceDpr: 2, lowHoldMs: 100 });
      let changed = false;
      for (let i = 0; i < 2; i++) changed = tickAdaptiveDpr(s, 50, HZ30) || changed;
      expect(changed).toBe(true);
      expect(s.current).toBe(1.75);
    });

    it('recovers on a 30 Hz display once frames keep pace', () => {
      const s = createAdaptiveDprState({ deviceDpr: 2, highHoldMs: 100 });
      s.current = 1.5;
      for (let i = 0; i < 4; i++) tickAdaptiveDpr(s, HZ30, HZ30);
      expect(s.current).toBe(1.75);
    });

    it('doubles the recovery hold when a step up does not hold', () => {
      const s = createAdaptiveDprState({
        deviceDpr: 2,
        lowHoldMs: 100,
        highHoldMs: 100,
        maxHighHoldMs: 300,
      });
      s.current = 1.5;
      for (let i = 0; i < 4; i++) tickAdaptiveDpr(s, HZ30, HZ30); // up to 1.75
      for (let i = 0; i < 3; i++) tickAdaptiveDpr(s, 50, HZ30); // straight back down
      expect(s.current).toBe(1.5);
      expect(s.highHoldMs).toBe(200);
      for (let i = 0; i < 7; i++) tickAdaptiveDpr(s, HZ30, HZ30);
      for (let i = 0; i < 3; i++) tickAdaptiveDpr(s, 50, HZ30);
      expect(s.highHoldMs).toBe(300);
    });
  });
});
