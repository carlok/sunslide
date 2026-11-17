import { createStore } from '../logic/store.js';
import { resolveLocale, LANG_STORAGE_KEY, SUPPORTED_LOCALES } from './locale.js';
import { MESSAGE_TABLES } from './messages/index.js';
import { translate } from './translate.js';
import { applyDomI18n } from './dom.js';

const store = createStore();
let currentLocale = 'en';
const listeners = new Set();

export { SUPPORTED_LOCALES, resolveLocale, LANG_STORAGE_KEY };

export function getLocale() {
  return currentLocale;
}

/**
 * @param {string} locale
 * @param {{ persist?: boolean }} [opts]
 */
export function setLocale(locale, opts = { persist: true }) {
  const next = resolveLocale({
    urlLang: locale,
    storedLang: null,
    navigatorLanguages: [],
  });
  if (next === currentLocale) return currentLocale;
  currentLocale = next;
  document.documentElement.lang = next;
  document.body?.classList.toggle('locale-ko', next === 'ko');
  if (opts.persist !== false) {
    try {
      store.set(LANG_STORAGE_KEY, next);
    } catch {
      /* private mode */
    }
  }
  applyDomI18n(t);
  for (const fn of listeners) fn(next);
  return next;
}

export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function t(key, params) {
  const table = MESSAGE_TABLES[currentLocale] || MESSAGE_TABLES.en;
  if (table[key] != null) return translate(table, key, params);
  if (MESSAGE_TABLES.en[key] != null) return translate(MESSAGE_TABLES.en, key, params);
  return key;
}

export function initI18n() {
  let stored;
  try {
    stored = store.get(LANG_STORAGE_KEY, null);
  } catch {
    stored = null;
  }
  const params = new URLSearchParams(typeof location !== 'undefined' ? location.search : '');
  const urlLang = params.get('lang');
  currentLocale = resolveLocale({
    urlLang,
    storedLang: stored,
    navigatorLanguages:
      typeof navigator !== 'undefined' ? navigator.languages || [navigator.language] : [],
  });
  document.documentElement.lang = currentLocale;
  document.body?.classList.toggle('locale-ko', currentLocale === 'ko');
  if (urlLang && resolveLocale({ urlLang, storedLang: null, navigatorLanguages: [] })) {
    try {
      store.set(LANG_STORAGE_KEY, currentLocale);
    } catch {
      /* */
    }
  }
  applyDomI18n(t);
  if (typeof window !== 'undefined' && !window.__ssBoot) {
    const key = window.__ssI18nFailKey || 'meta.failLoad';
    window.__ssFailMsg = t(key);
    window.__ssFail = (msg) => {
      const o = document.getElementById('ov');
      if (o) {
        o.classList.remove('hide');
        o.innerHTML = `<h1>SUNSLIDE</h1><p>${msg || t(key)}</p>`;
      }
    };
  }
  return currentLocale;
}