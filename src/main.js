import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';
import { initTutorial } from './tutorial.js';

async function boot() {
  initAppMenu();
  initTutorial();
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