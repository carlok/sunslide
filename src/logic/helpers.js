import { GW as GRID_W } from './constants.js';

export const mod = (a, n) => ((a % n) + n) % n;
export const wrapD = (d, gw = GRID_W) => mod(d + gw / 2, gw) - gw / 2;
export const angD = (d) => mod(d + Math.PI, Math.PI * 2) - Math.PI;
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const ri = (n) => (Math.random() * n) | 0;
export const smooth = (t) => t * t * (3 - 2 * t);
export const hash = (a, b, c) => {
  const s = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453;
  return s - Math.floor(s);
};