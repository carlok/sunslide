import en from './en.js';
import it from './it.js';
import ko from './ko.js';

export const MESSAGE_TABLES = { en, it, ko };

/** @returns {string[]} */
export function allMessageKeys() {
  return Object.keys(MESSAGE_TABLES.en).sort();
}

/**
 * @returns {{ ok: boolean, missing: Record<string, string[]> }}
 */
export function validateLocaleParity() {
  const base = new Set(allMessageKeys());
  const missing = {};
  for (const locale of ['it', 'ko']) {
    const table = MESSAGE_TABLES[locale];
    const lack = [...base].filter((k) => table[k] == null);
    const extra = Object.keys(table).filter((k) => !base.has(k));
    if (lack.length || extra.length) missing[locale] = [...lack, ...extra];
  }
  return {
    ok: Object.keys(missing).length === 0,
    missing,
  };
}