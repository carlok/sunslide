/** Minimum touch target size (WCAG / mobile comfort). */
export const MIN_TOUCH_CSS_PX = 44;

export function meetsTouchTargetSize(width, height, min = MIN_TOUCH_CSS_PX) {
  const w = Number(width);
  const h = Number(height);
  const m = Number(min);
  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(m)) return false;
  return w >= m && h >= m;
}