import { initAppMenu } from './menu.js';
import { initSettingsMenu } from './settings-menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';

async function boot() {
  initAppMenu();
  initSettingsMenu();
  initMapToggle();
  initFullscreen();
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();