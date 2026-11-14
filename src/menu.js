/** Accessible hamburger menu: credits + controls (Esc, outside click). */
export function initAppMenu() {
  const btn = document.getElementById('menuBtn');
  const panel = document.getElementById('menuPanel');
  const scrim = document.getElementById('menuScrim');
  if (!btn || !panel || !scrim) return;

  const isOpen = () => btn.getAttribute('aria-expanded') === 'true';

  const close = () => {
    if (!isOpen()) return;
    btn.setAttribute('aria-expanded', 'false');
    panel.classList.add('hide');
    scrim.classList.add('hide');
    document.removeEventListener('keydown', onKey, true);
    document.removeEventListener('pointerdown', onOutside, true);
  };

  const open = () => {
    btn.setAttribute('aria-expanded', 'true');
    panel.classList.remove('hide');
    scrim.classList.remove('hide');
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('pointerdown', onOutside, true);
    const first = panel.querySelector('a, button, [href]');
    if (first && typeof first.focus === 'function') first.focus();
    else panel.focus();
  };

  const toggle = () => (isOpen() ? close() : open());

  function onKey(e) {
    if (e.code !== 'Escape') return;
    e.preventDefault();
    e.stopPropagation();
    close();
    btn.focus();
  }

  function onOutside(e) {
    const t = e.target;
    if (panel.contains(t) || btn.contains(t) || scrim === t) return;
    close();
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggle();
  });
  scrim.addEventListener('click', close);
}