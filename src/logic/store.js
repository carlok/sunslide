/** Namespaced localStorage access. */
export function createStore(storage, prefix = 'sunslide.') {
  const st = storage ?? (typeof localStorage !== 'undefined' ? localStorage : null);
  if (!st) {
    return {
      get(_k, d) { return d; },
      set() {},
    };
  }
  return {
    get(k, d) {
      try {
        const v = st.getItem(prefix + k);
        return v === null ? d : JSON.parse(v);
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        st.setItem(prefix + k, JSON.stringify(v));
      } catch {
        /* quota or private mode */
      }
    },
  };
}

export const store = createStore();