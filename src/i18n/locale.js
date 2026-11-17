/** Browser language resolution (pure, testable). */

export const SUPPORTED_LOCALES = ['en', 'it', 'ko'];
export const DEFAULT_LOCALE = 'en';
export const LANG_STORAGE_KEY = 'lang';

/** @param {string | null | undefined} tag */
export function normalizeLocaleTag(tag) {
  if (!tag || typeof tag !== 'string') return null;
  const base = tag.trim().toLowerCase().split(/[-_]/)[0];
  return SUPPORTED_LOCALES.includes(base) ? base : null;
}

/**
 * @param {{ urlLang?: string | null, storedLang?: string | null, navigatorLanguages?: string[] }} ctx
 */
export function resolveLocale(ctx = {}) {
  const fromUrl = normalizeLocaleTag(ctx.urlLang);
  if (fromUrl) return fromUrl;
  const stored = normalizeLocaleTag(ctx.storedLang);
  if (stored) return stored;
  const nav = ctx.navigatorLanguages || [];
  for (const tag of nav) {
    const m = normalizeLocaleTag(tag);
    if (m) return m;
  }
  return DEFAULT_LOCALE;
}