import { describe, expect, it } from 'vitest';
import { CATCH_RAD, catchAngle, isCaught } from '../../src/logic/catch.js';

const DEG = Math.PI / 180;
const CELL_LON = 360 / 32 * DEG; // one grid column
const CELL_LAT = 140 / 16 * DEG; // one grid row

describe('catch on the sphere', () => {
  it('is zero for the same point and symmetric', () => {
    expect(catchAngle(1, 0.3, 1, 0.3)).toBe(0);
    expect(catchAngle(0.2, 0.1, 0.5, -0.2)).toBeCloseTo(catchAngle(0.5, -0.2, 0.2, 0.1), 12);
  });

  it('matches plain latitude difference along a meridian', () => {
    expect(catchAngle(0, 0, 0, 0.05)).toBeCloseTo(0.05, 10);
  });

  it('does not catch from a visible gap at the equator', () => {
    // The old flat-grid radius (0.6 cells) caught here.
    expect(isCaught(0, 0, 0.6 * CELL_LON, 0)).toBe(false);
  });

  it('catches overlapping bodies near the poles', () => {
    const lat = 70 * DEG - 0.5 * CELL_LAT; // centre of the polar-most row
    // Same 0.6-cell east-west offset: on the ground it is much shorter up here.
    expect(isCaught(0, lat, 0.6 * CELL_LON, lat)).toBe(true);
  });

  it('wraps across longitude 0 / 2π', () => {
    expect(isCaught(0.01, 0, 2 * Math.PI - 0.01, 0)).toBe(true);
  });

  it('uses the touch distance of the drawn bodies', () => {
    expect(isCaught(0, 0, 0, CATCH_RAD * 0.99)).toBe(true);
    expect(isCaught(0, 0, 0, CATCH_RAD * 1.01)).toBe(false);
    expect(isCaught(0, 0, 0, 0.2, 0.25)).toBe(true);
  });
});
