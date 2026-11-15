/** Planet greening percent — bubble ecology vs sector bubble target (compatible with #41). */

export function planetGreenPercent(greenCount, target) {
  const g = Math.max(0, Math.floor(Number(greenCount)) || 0);
  const t = Math.max(0, Math.floor(Number(target)) || 0);
  if (t <= 0) return g > 0 ? 100 : 0;
  return Math.min(100, Math.round((g * 100) / t));
}
