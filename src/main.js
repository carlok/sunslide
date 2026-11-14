import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';

async function boot() {
  initAppMenu();
  initMapToggle();
  initFullscreen();
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();