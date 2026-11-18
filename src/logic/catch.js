/**
 * Pip/bat contact on the sphere.
 *
 * Grid cells shrink east–west toward the poles (a cell spans 11.25° of longitude but only
 * cos(lat) of that on the ground), so a flat-grid radius catches from a visible gap at the
 * equator and lets bodies overlap near the poles. Measure the great-circle angle instead.
 */

/** Drawn frog (~0.045 rad) + bat body (~0.024 rad), plus a hair of slack. */
export const CATCH_RAD = 0.072;

/** Great-circle angle (radians) between two lon/lat points (radians). */
export function catchAngle(lonA, latA, lonB, latB) {
  const s1 = Math.sin((latB - latA) / 2);
  const s2 = Math.sin((lonB - lonA) / 2);
  const h = s1 * s1 + Math.cos(latA) * Math.cos(latB) * s2 * s2;
  return 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** True when two actors at lon/lat (radians) are close enough to touch. */
export function isCaught(lonA, latA, lonB, latB, rad = CATCH_RAD) {
  return catchAngle(lonA, latA, lonB, latB) < rad;
}
