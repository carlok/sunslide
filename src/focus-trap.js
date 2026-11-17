/** Keep Tab / Shift+Tab inside a modal container (menu, tutorial card). */
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),summary,[tabindex]:not([tabindex="-1"])';

/** Visible, enabled focus targets inside `container`, in DOM order. */
export function focusableIn(container) {
  return [...container.querySelectorAll(FOCUSABLE)].filter(
    (el) => el.getClientRects().length > 0 && !el.closest('.hide'),
  );
}

/**
 * Wrap focus at the ends of `container`. Also pulls focus back in when it sits on the container
 * itself or has escaped it. Returns true when it handled the event.
 * @param {HTMLElement} container
 * @param {KeyboardEvent} e
 */
export function trapTab(container, e) {
  if (e.key !== 'Tab') return false;
  const items = focusableIn(container);
  if (!items.length) {
    e.preventDefault();
    container.focus?.();
    return true;
  }
  const first = items[0];
  const last = items[items.length - 1];
  const active = document.activeElement;
  const lost = active === container || !container.contains(active);
  if (e.shiftKey && (lost || active === first)) {
    e.preventDefault();
    last.focus();
    return true;
  }
  if (!e.shiftKey && (lost || active === last)) {
    e.preventDefault();
    first.focus();
    return true;
  }
  return false;
}
