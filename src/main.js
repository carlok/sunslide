import { initAppMenu } from './menu.js';
import { initMapToggle } from './map-toggle.js';
import { initFullscreen } from './fullscreen.js';
import { initWinScreen } from './win-screen.js';

async function boot() {
  initAppMenu();
  initMapToggle();
  initFullscreen();
  const { startSunslide } = await import('virtual:sunslide-game');
  const winScreen = initWinScreen({
    onPlayAgain: () => window.__sunslide?.startGame(),
    onMenu: () => window.__sunslide?.goTitle(),
  });
  window.__ssShowWin = (stats) => winScreen.show(stats);
  startSunslide();
}
boot();