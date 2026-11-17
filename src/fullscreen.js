/**
 * Enter fullscreen when the player starts a run (PLAY / AGAIN / Restart). Once they leave fullscreen
 * themselves, never force it again this session. Other gestures (Tab, tutorial Skip, menu taps) never
 * trigger it.
 */
const root = document.documentElement;

function fullscreenActive() {
  return !!(document.fullscreenElement || document.webkitFullscreenElement);
}

function requestFullscreen() {
  if (typeof window !== 'undefined' && window.__ssSmokeNoFullscreen) return;
  if (fullscreenActive()) return;
  const req = root.requestFullscreen || root.webkitRequestFullscreen;
  if (!req) return;
  try {
    const p = req.call(root);
    if (p?.catch) p.catch(() => {});
  } catch {
    /* iOS / unsupported */
  }
}

let enteredOnce = false;
let respectUserExit = false;

function onFullscreenChange() {
  window.dispatchEvent(new Event('resize'));
  if (fullscreenActive()) enteredOnce = true;
  else if (enteredOnce) respectUserExit = true;
}

function armFullscreenSession() {
  if (respectUserExit) return;
  requestFullscreen();
}

function bindStartButtons() {
  for (const id of ['go', 'again', 'winAgain']) {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', armFullscreenSession, true);
  }
  const restart = document.getElementById('restart');
  if (restart) {
    restart.addEventListener('click', () => {
      armFullscreenSession();
    }, true);
  }
}

export function initFullscreen() {
  document.addEventListener('fullscreenchange', onFullscreenChange);
  document.addEventListener('webkitfullscreenchange', onFullscreenChange);
  bindStartButtons();
}