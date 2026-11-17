/** Shadow tiering and shadow-map refresh policy (pure). */

export const SHADOW_FRUSTUM = {
  left: -1.05,
  right: 1.05,
  top: 1.05,
  bottom: -1.05,
  near: 2.8,
  far: 7,
};

/**
 * Low-end: coarse pointer plus weak CPU/RAM, or very few cores.
 * @param {{ coarsePointer?: boolean, hardwareConcurrency?: number, deviceMemory?: number }} ctx
 */
export function deviceAllowsShadows(ctx) {
  const quality = ctx.qualityShadow ?? 0;
  if (quality <= 0) return false;
  const cores = Number(ctx.hardwareConcurrency);
  const mem = Number(ctx.deviceMemory);
  const coarse = ctx.coarsePointer === true;
  const coreN = Number.isFinite(cores) && cores > 0 ? cores : 8;
  const memN = Number.isFinite(mem) && mem > 0 ? mem : 8;
  if (coreN <= 2) return false;
  if (coarse && coreN <= 4 && memN < 4) return false;
  if (coarse && memN <= 2) return false;
  return true;
}

/** @returns {0|512|1024} */
export function shadowMapResolution(ctx) {
  if (!deviceAllowsShadows(ctx)) return 0;
  const coarse = ctx.coarsePointer === true;
  const mobile = coarse || (ctx.viewportWidth ?? 0) < 768;
  return mobile ? 512 : 1024;
}

/**
 * @returns {{ enabled: boolean, mapSize: number }}
 */
export function resolveShadowSettings(ctx) {
  const mapSize = shadowMapResolution(ctx);
  if (mapSize <= 0) return { enabled: false, mapSize: 0 };
  const cap = Math.max(0, ctx.qualityShadow ?? mapSize);
  const size = cap > 0 ? Math.min(cap, mapSize) : mapSize;
  return { enabled: true, mapSize: size };
}

/**
 * With autoUpdate off, refresh the shadow map when the lit scene moves.
 * @param {{ shadowsEnabled: boolean, gameState: string, paused: boolean, tilesAnimating: boolean }} ctx
 */
export function shouldUpdateShadowMap(ctx) {
  if (!ctx.shadowsEnabled) return false;
  // Nothing lit moves while paused; forced redraws (re-allocated map, capture poses) go through the
  // renderer's shadowDirty flag instead.
  if (ctx.paused) return false;
  if (ctx.tilesAnimating) return true;
  if (ctx.gameState === 'title' || ctx.gameState === 'over') return true;
  if (ctx.gameState === 'warp' || ctx.gameState === 'dying' || ctx.gameState === 'clear') return true;
  if (ctx.gameState === 'win') return true;
  if (ctx.gameState === 'play' && !ctx.paused) return true;
  return false;
}