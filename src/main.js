import { initAppMenu } from './menu.js';

async function boot() {
  initAppMenu();
  const { startSunslide } = await import('virtual:sunslide-game');
  startSunslide();
}
boot();