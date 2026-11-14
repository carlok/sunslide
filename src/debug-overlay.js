/** FPS + renderer.info overlay (?debug only — loaded from main.js). */

export function initDebugOverlay() {
  const root = document.createElement('pre');
  root.id = 'debugOverlay';
  root.setAttribute('aria-live', 'off');
  root.style.cssText =
    'position:fixed;left:calc(8px + env(safe-area-inset-left));top:calc(52px + env(safe-area-inset-top));z-index:11;margin:0;padding:8px 10px;font:11px/1.45 ui-monospace,monospace;color:#dff;margin:0;white-space:pre;pointer-events:none;user-select:none;border-radius:8px;border:1px solid rgba(63,214,234,.35);background:rgba(4,5,13,.78);text-shadow:0 1px 6px #000';
  document.body.appendChild(root);

  let last = performance.now();
  let fpsEma = 60;

  function tick(now) {
    const dt = Math.max(0.001, now - last);
    last = now;
    fpsEma = fpsEma * 0.88 + (1000 / dt) * 0.12;

    const S = window.__sunslide;
    if (!S) {
      root.textContent = 'debug: waiting for game…';
      requestAnimationFrame(tick);
      return;
    }
    const m = S.getRenderMetrics();
    const info = m.info || {};
    const rend = info.render || {};
    const mem = info.memory || {};
    root.textContent =
      `FPS ${fpsEma.toFixed(1)}\n` +
      `draws ${rend.calls ?? '—'}  tris ${rend.triangles ?? '—'}  pts ${rend.points ?? '—'}\n` +
      `geom ${mem.geometries ?? '—'}  tex ${mem.textures ?? '—'}\n` +
      `pixelRatio ${m.pixelRatio?.toFixed(3) ?? '—'}  adaptive ${m.adaptiveDpr?.toFixed(3) ?? '—'}\n` +
      `buf ${m.canvasBuffer?.join('×') ?? '—'}  bloom ${m.useBloom ? 'on' : 'off'}`;
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}