import { formatStarRow, formatTitleStarsLine, normalizeStarsMap } from './logic/sector-stars.js';
import { store } from './logic/store.js';

export function initClearStars() {
  const panel = document.getElementById('clearStars');
  const row = document.getElementById('starRow');
  const meta = document.getElementById('clearStarMeta');
  const starline = document.getElementById('starline');

  function refreshTitleStars() {
    if (!starline) return;
    const line = formatTitleStarsLine(store.get('stars', {}));
    starline.textContent = line;
    starline.classList.toggle('hide', !line);
  }

  function hide() {
    panel?.classList.add('hide');
  }

  function show(payload) {
    if (!panel || !row || !meta) return;
    const stars = Math.min(3, Math.max(1, Math.floor(payload.stars) || 1));
    const sector = payload.sector ?? 1;
    const moves = Math.max(0, Math.floor(payload.moves) || 0);
    const par = Math.max(1, Math.floor(payload.par) || 1);
    row.textContent = formatStarRow(stars);
    meta.textContent = `Sector ${sector} · ${moves} moves (par ${par})`;
    panel.setAttribute(
      'aria-label',
      `Sector ${sector} cleared with ${stars} of 3 stars, ${moves} moves, par ${par}`,
    );
    panel.classList.remove('hide');
    refreshTitleStars();
  }

  refreshTitleStars();
  return { show, hide, refreshTitleStars };
}