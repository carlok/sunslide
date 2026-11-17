/** Message lookup and `{param}` interpolation. */

/**
 * @param {string} template
 * @param {Record<string, string | number> | undefined} params
 */
export function formatMessage(template, params) {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    params[key] != null ? String(params[key]) : `{${key}}`,
  );
}

/**
 * @param {Record<string, string>} table
 * @param {string} key
 * @param {Record<string, string | number> | undefined} params
 */
export function translate(table, key, params) {
  const raw = table[key];
  if (raw == null) return key;
  return formatMessage(raw, params);
}