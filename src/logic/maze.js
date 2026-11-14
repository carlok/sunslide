import { TW, TH, N, DX, DY } from './constants.js';

/** Generate wall bitmask maze for one island (same algorithm as in-game makeTile). */
export function generateMazeWalls(rng = Math.random) {
  const walls = new Uint8Array(N).fill(15);
  const inside = (x, y) => x >= 0 && y >= 0 && x < TW && y < TH;
  const open = (i, d) => {
    const x = i % TW;
    const y = (i / TW) | 0;
    const nx = x + DX[d];
    const ny = y + DY[d];
    if (!inside(nx, ny)) return;
    walls[i] &= ~(1 << d);
    walls[ny * TW + nx] &= ~(1 << ((d + 2) & 3));
  };
  const seen = new Uint8Array(N);
  const st = [(rng() * N) | 0];
  seen[st[0]] = 1;
  while (st.length) {
    const i = st[st.length - 1];
    const x = i % TW;
    const y = (i / TW) | 0;
    const opts = [];
    for (let d = 0; d < 4; d++) {
      const nx = x + DX[d];
      const ny = y + DY[d];
      if (inside(nx, ny) && !seen[ny * TW + nx]) opts.push(d);
    }
    if (!opts.length) {
      st.pop();
      continue;
    }
    const d = opts[(rng() * opts.length) | 0];
    const j = (y + DY[d]) * TW + x + DX[d];
    open(i, d);
    seen[j] = 1;
    st.push(j);
  }
  for (let i = 0; i < N; i++) {
    for (const d of [1, 2]) if (rng() < 0.32) open(i, d);
  }
  for (let i = 0; i < N; i++) {
    const w = walls[i];
    let c = 0;
    for (let d = 0; d < 4; d++) if (w & (1 << d)) c++;
    if (c >= 3) {
      const x = i % TW;
      const y = (i / TW) | 0;
      const ds = [];
      for (let d = 0; d < 4; d++) {
        if (w & (1 << d) && inside(x + DX[d], y + DY[d])) ds.push(d);
      }
      if (ds.length) open(i, ds[(rng() * ds.length) | 0]);
    }
  }
  return walls;
}