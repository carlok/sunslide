import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';
import { initClearStars } from './clear-stars.js';

async function boot() {
  initAppMenu();
  initMapToggle();
  initFullscreen();
  const clearStars = initClearStars();
  window.__ssShowClearStars = (payload) => clearStars.show(payload);
  window.__ssHideClearStars = () => clearStars.hide();
  window.__ssRefreshTitleStars = () => clearStars.refreshTitleStars();
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
  clearStars.refreshTitleStars();
}
boot();