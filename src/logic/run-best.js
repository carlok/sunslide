/** Best completed run stored under `sunslide.best` — fewer moves, then less time. */

export const BEST_KEY = 'best';

export function normalizeRunRecord(raw) {
  if (raw == null) return null;
  if (typeof raw === 'number') return null;
  if (typeof raw !== 'object') return null;
  const moves = Number(raw.moves);
  const timeMs = Number(raw.timeMs);
  if (!Number.isFinite(moves) || !Number.isFinite(timeMs) || moves < 0 || timeMs < 0) return null;
  return { moves: Math.round(moves), timeMs: Math.round(timeMs) };
}

/** `true` if `candidate` strictly beats `previous` (null previous always loses to any valid candidate). */
export function isBetterRun(candidate, previous) {
  const c = normalizeRunRecord(candidate);
  if (!c) return false;
  const p = normalizeRunRecord(previous);
  if (!p) return true;
  if (c.moves !== p.moves) return c.moves < p.moves;
  return c.timeMs < p.timeMs;
}

export function compareRuns(a, b) {
  const na = normalizeRunRecord(a);
  const nb = normalizeRunRecord(b);
  if (!na && !nb) return 0;
  if (!na) return 1;
  if (!nb) return -1;
  if (na.moves !== nb.moves) return na.moves - nb.moves;
  return na.timeMs - nb.timeMs;
}

/**
 * Persist a run if it beats the stored best.
 * @returns {{ isNewBest: boolean, best: import('./run-best.js').normalizeRunRecord extends () => infer R ? R : null }}
 */
export function commitRunBest(store, record) {
  const next = normalizeRunRecord(record);
  const prev = normalizeRunRecord(store.get(BEST_KEY, null));
  if (!next) return { isNewBest: false, best: prev };
  const isNewBest = isBetterRun(next, prev);
  if (isNewBest) store.set(BEST_KEY, next);
  return { isNewBest, best: isNewBest ? next : prev };
}

export function formatRunTime(timeMs) {
  const ms = Math.max(0, Math.round(timeMs));
  const sec = Math.floor(ms / 1000);
  const frac = Math.floor((ms % 1000) / 100);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m > 0) return `${m}:${String(s).padStart(2, '0')}.${frac}`;
  return `${s}.${frac}s`;
}

export function formatBestLine(best) {
  const b = normalizeRunRecord(best);
  if (!b) return '';
  return `Best run: ${b.moves} moves · ${formatRunTime(b.timeMs)}`;
}