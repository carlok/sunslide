import { describe, expect, it } from 'vitest';
import {
  BEST_KEY,
  normalizeRunRecord,
  isBetterRun,
  compareRuns,
  commitRunBest,
  formatRunTime,
  formatBestLine,
} from '../../src/logic/run-best.js';
import { createStore } from '../../src/logic/store.js';

describe('run-best', () => {
  it('normalizes run records and rejects legacy score numbers', () => {
    expect(normalizeRunRecord({ moves: 12, timeMs: 45000 })).toEqual({ moves: 12, timeMs: 45000 });
    expect(normalizeRunRecord({ moves: -1, timeMs: 0 })).toBeNull();
    expect(normalizeRunRecord(9000)).toBeNull();
  });

  it('prefers fewer moves, then less time', () => {
    const a = { moves: 10, timeMs: 60000 };
    const b = { moves: 11, timeMs: 1000 };
    expect(isBetterRun(a, b)).toBe(true);
    expect(isBetterRun(b, a)).toBe(false);
    expect(isBetterRun({ moves: 10, timeMs: 5000 }, { moves: 10, timeMs: 6000 })).toBe(true);
    expect(compareRuns(a, b)).toBeLessThan(0);
  });

  it('commits only improving runs to sunslide.best', () => {
    const mem = new Map();
    const store = createStore({
      getItem: (k) => mem.get(k) ?? null,
      setItem: (k, v) => mem.set(k, v),
    });
    expect(BEST_KEY).toBe('best');
    const first = commitRunBest(store, { moves: 20, timeMs: 120000 });
    expect(first.isNewBest).toBe(true);
    expect(mem.get(`sunslide.${BEST_KEY}`)).toBe(JSON.stringify({ moves: 20, timeMs: 120000 }));
    const worse = commitRunBest(store, { moves: 25, timeMs: 90000 });
    expect(worse.isNewBest).toBe(false);
    const better = commitRunBest(store, { moves: 18, timeMs: 200000 });
    expect(better.isNewBest).toBe(true);
  });

  it('formats time and title line', () => {
    expect(formatRunTime(45200)).toBe('45.2s');
    expect(formatRunTime(125400)).toBe('2:05.4');
    expect(formatBestLine({ moves: 8, timeMs: 33000 })).toBe('Best run: 8 moves · 33.0s');
    expect(formatBestLine(null)).toBe('');
  });
});