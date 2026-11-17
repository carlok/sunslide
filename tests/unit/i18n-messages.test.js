import { describe, expect, it } from 'vitest';
import {
  MESSAGE_TABLES,
  allMessageKeys,
  validateLocaleParity,
} from '../../src/i18n/messages/index.js';

describe('i18n message tables', () => {
  it('has equal keys in en, it, and ko', () => {
    const { ok, missing } = validateLocaleParity();
    expect(missing).toEqual({});
    expect(ok).toBe(true);
  });

  it('requires non-empty strings for every key', () => {
    for (const locale of ['en', 'it', 'ko']) {
      const table = MESSAGE_TABLES[locale];
      for (const key of allMessageKeys()) {
        expect(typeof table[key]).toBe('string');
        expect(table[key].length).toBeGreaterThan(0);
      }
    }
  });
});