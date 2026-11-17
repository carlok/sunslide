import { initI18n, onLocaleChange } from './i18n/index.js';
import { applyDomI18n } from './i18n/dom.js';
import { t } from './i18n/index.js';
import { initAppMenu } from './menu.js';
import { initSettingsMenu } from './settings-menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';
import { initClearStars } from './clear-stars.js';
import { initWinScreen } from './win-screen.js';
import { migrateLegacyBestScore } from './logic/run-best.js';
import { store } from './logic/store.js';
import { initTutorial } from './tutorial.js';

async function boot() {
  initI18n();
  window.__ssBoot = true;
  onLocaleChange(() => {
    applyDomI18n(t);
    window.__sunslide?.refreshHud?.();
    window.__sunslide?.syncPauseButtons?.();
  });
  initAppMenu();
  initSettingsMenu();
  const tutorial = initTutorial();
  // First-run cards appear on the first PLAY (over the held game), not stacked on the title screen.
  window.__ssOnGameStart = () => tutorial?.maybeAutoShow();
  initMapToggle();
  initFullscreen();
  migrateLegacyBestScore(store);
  if (new URLSearchParams(location.search).has('debug')) {
    const { initDebugOverlay } = await import('./debug-overlay.js');
    initDebugOverlay();
  }
  const clearStars = initClearStars();
  window.__ssShowClearStars = (payload) => clearStars.show(payload);
  window.__ssHideClearStars = () => clearStars.hide();
  window.__ssRefreshTitleStars = () => clearStars.refreshTitleStars();
  const { startSunslide } = await import('virtual:sunslide-game');
  const winScreen = initWinScreen({
    onPlayAgain: () => window.__sunslide?.startGame(),
    onMenu: () => window.__sunslide?.goTitle(),
  });
  window.__ssShowWin = (stats) => winScreen.show(stats);
  startSunslide();
  clearStars.refreshTitleStars();
}
boot();