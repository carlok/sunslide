import {
  formatStarRow,
  totalStarsCount,
  normalizeStarsMap,
} from './logic/sector-stars.js';
import { store } from './logic/store.js';
import { onLocaleChange, t } from './i18n/index.js';

export function initClearStars() {
  const panel = document.getElementById('clearStars');
  const row = document.getElementById('starRow');
  const meta = document.getElementById('clearStarMeta');
  const starline = document.getElementById('starline');
  let lastPayload = null;

  function refreshTitleStars() {
    if (!starline) return;
    const map = store.get('stars', {});
    const total = totalStarsCount(normalizeStarsMap(map));
    const line =
      total <= 0
        ? ''
        : t(total === 1 ? 'title.starsOne' : 'title.starsMany', { total });
    starline.textContent = line;
    starline.classList.toggle('hide', !line);
  }

  function hide() {
    panel?.classList.add('hide');
    lastPayload = null;
  }

  function show(payload) {
    if (!panel || !row || !meta) return;
    lastPayload = payload;
    const stars = Math.min(3, Math.max(1, Math.floor(payload.stars) || 1));
    const sector = payload.sector ?? 1;
    const moves = Math.max(0, Math.floor(payload.moves) || 0);
    const par = Math.max(1, Math.floor(payload.par) || 1);
    row.textContent = formatStarRow(stars);
    meta.textContent = t('clear.meta', { sector, moves, par });
    panel.setAttribute('aria-label', t('clear.aria', { sector, stars, moves, par }));
    panel.classList.remove('hide');
    refreshTitleStars();
  }

  onLocaleChange(() => {
    refreshTitleStars();
    if (!lastPayload || !panel || panel.classList.contains('hide')) return;
    const stars = Math.min(3, Math.max(1, Math.floor(lastPayload.stars) || 1));
    const sector = lastPayload.sector ?? 1;
    const moves = Math.max(0, Math.floor(lastPayload.moves) || 0);
    const par = Math.max(1, Math.floor(lastPayload.par) || 1);
    meta.textContent = t('clear.meta', { sector, moves, par });
    panel.setAttribute('aria-label', t('clear.aria', { sector, stars, moves, par }));
  });

  refreshTitleStars();
  return { show, hide, refreshTitleStars };
}