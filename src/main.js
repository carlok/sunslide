import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';

async function boot() {
  initAppMenu();
  initMapToggle();
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();