import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';
import { initTutorial } from './tutorial.js';

async function boot() {
  initAppMenu();
  initTutorial();
  initMapToggle();
  initFullscreen();
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();