import { describe, expect, it } from 'vitest';
import { CAMERA, closeCameraOffset, farOrbitDistance } from '../../src/logic/camera.js';

const LEGACY = {
  followDistance: 1.3,
  pitchDeg: 58,
  farMinDistance: 3.05,
};

describe('camera tuning', () => {
  it('keeps modest delta from legacy close chase (roughly 15-25%)', () => {
    const dRatio = CAMERA.followDistance / LEGACY.followDistance;
    const pitchDelta = LEGACY.pitchDeg - CAMERA.pitchDeg;
    const farRatio = CAMERA.farMinDistance / LEGACY.farMinDistance;
    expect(dRatio).toBeGreaterThan(0.75);
    expect(dRatio).toBeLessThan(0.88);
    expect(pitchDelta).toBeGreaterThanOrEqual(9);
    expect(pitchDelta).toBeLessThanOrEqual(14);
    expect(farRatio).toBeGreaterThan(0.8);
    expect(farRatio).toBeLessThan(0.88);
  });

  it('closeCameraOffset matches spherical offset math', () => {
    const off = closeCameraOffset(1, 90);
    expect(off.alongTangent).toBeCloseTo(1, 5);
    expect(off.alongNormal).toBeCloseTo(0, 5);
    const low = closeCameraOffset(1, 30);
    expect(low.alongTangent).toBeCloseTo(0.5, 5);
    expect(low.alongNormal).toBeCloseTo(-Math.sqrt(3) / 2, 5);
  });

  it('farOrbitDistance never drops below configured floor', () => {
    for (const aspect of [0.25, 0.5, 1, 1.6, 2.4]) {
      expect(farOrbitDistance(aspect)).toBeGreaterThanOrEqual(CAMERA.farMinDistance);
    }
    expect(CAMERA.farMinDistance / LEGACY.farMinDistance).toBeLessThan(0.88);
  });
});