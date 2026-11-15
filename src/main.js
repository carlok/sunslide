import { initAppMenu } from './menu.js';
import { initSettingsMenu } from './settings-menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';
import { initWinScreen } from './win-screen.js';
import { migrateLegacyBestScore } from './logic/run-best.js';
import { store } from './logic/store.js';
import { initTutorial } from './tutorial.js';

async function boot() {
  initAppMenu();
  initSettingsMenu();
  initTutorial();
  initMapToggle();
  initFullscreen();
  migrateLegacyBestScore(store);
  if (new URLSearchParams(location.search).has('debug')) {
    const { initDebugOverlay } = await import('./debug-overlay.js');
    initDebugOverlay();
  }
  const { startSunslide } = await import('virtual:sunslide-game');
  const winScreen = initWinScreen({
    onPlayAgain: () => window.__sunslide?.startGame(),
    onMenu: () => window.__sunslide?.goTitle(),
  });
  window.__ssShowWin = (stats) => winScreen.show(stats);
  startSunslide();
}
boot();