/** Settings controls inside the hamburger menu. */
import { createStore } from './logic/store.js';
import { settingsFromStore, writeSettings } from './logic/settings.js';
import { applyDomI18n } from './i18n/dom.js';
import { getLocale, onLocaleChange, setLocale, t } from './i18n/index.js';

export function initSettingsMenu() {
  const root = document.getElementById('menuSettings');
  if (!root) return;

  const store = createStore();
  const el = {
    sound: document.getElementById('setSound'),
    music: document.getElementById('setMusic'),
    haptics: document.getElementById('setHaptics'),
    quality: document.getElementById('setQuality'),
    reducedMotion: document.getElementById('setReducedMotion'),
    colorBlind: document.getElementById('setColorBlind'),
    lang: document.getElementById('setLang'),
  };

  const applyToGame = (patch) => {
    const next = writeSettings(store, patch);
    window.__sunslide?.applySettings?.(next);
    return next;
  };

  const syncUi = () => {
    const s = settingsFromStore(store);
    if (el.sound) el.sound.checked = s.sound;
    if (el.music) el.music.checked = s.music;
    if (el.haptics) {
      el.haptics.checked = s.haptics;
      el.haptics.disabled = !(
        typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
      );
    }
    if (el.quality) el.quality.value = String(s.quality);
    if (el.reducedMotion) {
      el.reducedMotion.value =
        s.reducedMotion === null ? 'system' : s.reducedMotion ? 'on' : 'off';
    }
    if (el.colorBlind) el.colorBlind.checked = s.colorBlind;
    if (el.lang) el.lang.value = getLocale();
  };

  const onSound = () => applyToGame({ sound: !!el.sound?.checked });
  const onMusic = () => applyToGame({ music: !!el.music?.checked });
  const onHaptics = () => applyToGame({ haptics: !!el.haptics?.checked });
  const onQuality = () => {
    const raw = el.quality?.value;
    const q = raw === 'auto' ? 'auto' : Number(raw);
    applyToGame({ quality: q });
  };
  const onReduced = () => {
    const v = el.reducedMotion?.value;
    const reducedMotion = v === 'system' ? null : v === 'on';
    applyToGame({ reducedMotion });
  };
  const onColorBlind = () => applyToGame({ colorBlind: !!el.colorBlind?.checked });
  const onLang = () => {
    if (el.lang?.value) setLocale(el.lang.value);
    applyDomI18n(t);
    window.__sunslide?.refreshHud?.();
    window.__sunslide?.syncPauseButtons?.();
    if (typeof window.__ssRefreshTitleStars === 'function') window.__ssRefreshTitleStars();
  };

  el.sound?.addEventListener('change', onSound);
  el.music?.addEventListener('change', onMusic);
  el.haptics?.addEventListener('change', onHaptics);
  el.quality?.addEventListener('change', onQuality);
  el.reducedMotion?.addEventListener('change', onReduced);
  el.colorBlind?.addEventListener('change', onColorBlind);
  el.lang?.addEventListener('change', onLang);

  onLocaleChange(() => syncUi());

  const menuBtn = document.getElementById('menuBtn');
  menuBtn?.addEventListener('click', () => {
    requestAnimationFrame(syncUi);
  });

  syncUi();
}