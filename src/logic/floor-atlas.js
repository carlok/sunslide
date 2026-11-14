/** UV rectangle for a tile floor in a grid atlas (pure). */

export function atlasGridForCount(n) {
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  return { cols, rows };
}

export function atlasRectForTile(tileId, cols, rows) {
  const c = tileId % cols;
  const r = Math.floor(tileId / cols);
  const u0 = c / cols;
  const v0 = 1 - (r + 1) / rows;
  const u1 = (c + 1) / cols;
  const v1 = 1 - r / rows;
  return { u0, v0, u1, v1, du: 1 / cols, dv: 1 / rows };
}

/** Map mesh UV (0–1) into atlas space. */
export function mapUvToAtlas(u, v, rect) {
  return {
    u: rect.u0 + u * rect.du,
    v: rect.v0 + v * rect.dv,
  };
}