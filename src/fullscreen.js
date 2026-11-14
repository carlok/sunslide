/** Enter fullscreen on the first user gesture per session; respect exit during play. */
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

function onFullscreenChange() {
  window.dispatchEvent(new Event('resize'));
  if (!fullscreenActive() && window.__sunslide) {
    const st = window.__sunslide.state;
    if (st === 'play' || st === 'warp' || st === 'dying') {
      respectUserExit = true;
      pendingRequest = false;
    }
  }
}

let pendingRequest = true;
let respectUserExit = false;

function armFullscreenSession() {
  respectUserExit = false;
  pendingRequest = true;
  requestFullscreen();
}

function tryFullscreenFromGesture() {
  if (respectUserExit || !pendingRequest) return;
  pendingRequest = false;
  requestFullscreen();
}

function bindStartButtons() {
  for (const id of ['go', 'again']) {
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
  document.addEventListener(
    'pointerdown',
    (e) => {
      if (e.isPrimary === false) return;
      tryFullscreenFromGesture();
    },
    { capture: true, passive: true },
  );
  document.addEventListener(
    'keydown',
    (e) => {
      if (e.repeat) return;
      tryFullscreenFromGesture();
    },
    { capture: true },
  );
  bindStartButtons();
}