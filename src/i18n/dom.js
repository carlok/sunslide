/** Apply `data-i18n` / `data-i18n-html` / `data-i18n-aria` to the document. */

/**
 * @param {(key: string) => string} t
 */
export function applyDomI18n(t) {
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('option[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const key = el.getAttribute('data-i18n-html');
    if (key) el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
  const titleKey = document.documentElement.getAttribute('data-i18n-title');
  if (titleKey) document.title = t(titleKey);
  const desc = document.querySelector('meta[name="description"]');
  const descKey = desc?.getAttribute('data-i18n-content');
  if (desc && descKey) desc.setAttribute('content', t(descKey));
}