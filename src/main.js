import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';

async function boot() {
  initAppMenu();
  initMapToggle();
  initFullscreen();
  if (new URLSearchParams(location.search).has('debug')) {
    const { initDebugOverlay } = await import('./debug-overlay.js');
    initDebugOverlay();
  }
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();