import { DECL, TW, TH, CFG } from './constants.js';
import { gx2lon, gy2lat } from './constants.js';
import { clamp, smooth } from './helpers.js';

const sinD = Math.sin(DECL);
const cosD = Math.cos(DECL);

export function lightAt(gx, gy, sunLon) {
  const lat = gy2lat(gy);
  const lon = gx2lon(gx);
  const raw =
    Math.sin(lat) * sinD + Math.cos(lat) * cosD * Math.cos(lon - sunLon);
  return smooth(clamp((raw + 0.08) * 2.5, 0, 1));
}

export const lightSlot = (c, r, sunLon) =>
  lightAt(c * TW + TW / 2, r * TH + TH / 2, sunLon);

export function canSlideAtSlot(c, r, sunLon) {
  return lightSlot(c, r, sunLon) >= CFG.slideLight;
}