import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LANG_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocaleTag,
  resolveLocale,
} from '../../src/i18n/locale.js';

describe('normalizeLocaleTag', () => {
  it('maps supported bases', () => {
    expect(normalizeLocaleTag('en-US')).toBe('en');
    expect(normalizeLocaleTag('it-IT')).toBe('it');
    expect(normalizeLocaleTag('ko-KR')).toBe('ko');
  });

  it('rejects unsupported tags', () => {
    expect(normalizeLocaleTag('fr')).toBeNull();
    expect(normalizeLocaleTag('')).toBeNull();
  });
});

describe('resolveLocale', () => {
  it('prefers URL override', () => {
    expect(
      resolveLocale({
        urlLang: 'ko',
        storedLang: 'it',
        navigatorLanguages: ['en-US'],
      }),
    ).toBe('ko');
  });

  it('uses stored language when URL absent', () => {
    expect(
      resolveLocale({
        storedLang: 'it',
        navigatorLanguages: ['en-US'],
      }),
    ).toBe('it');
  });

  it('walks navigator.languages for first match', () => {
    expect(
      resolveLocale({
        navigatorLanguages: ['de-DE', 'it-CH', 'en'],
      }),
    ).toBe('it');
  });

  it('falls back to English', () => {
    expect(
      resolveLocale({
        navigatorLanguages: ['fr-FR', 'es'],
      }),
    ).toBe(DEFAULT_LOCALE);
  });
});

describe('locale constants', () => {
  it('lists three supported locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['en', 'it', 'ko']);
  });

  it('uses stable storage key', () => {
    expect(LANG_STORAGE_KEY).toBe('lang');
  });
});