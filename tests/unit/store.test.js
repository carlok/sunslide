import { describe, expect, it } from 'vitest';
import { createStore } from '../../src/logic/store.js';

describe('store', () => {
  it('reads and writes JSON values', () => {
    const data = new Map();
    const storage = {
      getItem: (k) => (data.has(k) ? data.get(k) : null),
      setItem: (k, v) => data.set(k, v),
    };
    const store = createStore(storage, 't.');
    expect(store.get('music', true)).toBe(true);
    store.set('music', false);
    expect(store.get('music', true)).toBe(false);
    expect(store.get('missing', 42)).toBe(42);
  });

  it('returns default on bad JSON', () => {
    const storage = { getItem: () => '{bad', setItem: () => {} };
    const store = createStore(storage, 'x.');
    expect(store.get('k', 7)).toBe(7);
  });
});