import { TW, TH, COLS, ROWS, N, DX, DY, GW } from './constants.js';
import { wrapD } from './helpers.js';
import { tilePos, liftOf } from './slots.js';

export function createMovementGraph(tiles, slotGrid) {
  function nbrLocal(t, x, y, d) {
    if (tiles[t].walls[y * TW + x] & (1 << d)) return null;
    const nx = x + DX[d];
    const ny = y + DY[d];
    return nx >= 0 && nx < TW && ny >= 0 && ny < TH ? { t, x: nx, y: ny } : null;
  }

  function nbr(t, x, y, d) {
    const T = tiles[t];
    const nx = x + DX[d];
    const ny = y + DY[d];
    if (nx >= 0 && nx < TW && ny >= 0 && ny < TH)
      return T.walls[y * TW + x] & (1 << d) ? null : { t, x: nx, y: ny };
    const r = T.slot.r + DY[d];
    if (r < 0 || r >= ROWS) return null;
    const c = (T.slot.c + DX[d] + COLS) % COLS;
    const u = slotGrid[r][c];
    if (u < 0 || T.anim || tiles[u].anim) return null;
    return { t: u, x: (nx + TW) % TW, y: (ny + TH) % TH };
  }

  const NN = 15 * N;
  const vis = new Int32Array(NN);
  const bq = new Int32Array(NN);
  const bfd = new Int8Array(NN);
  const bdd = new Int16Array(NN);
  let stamp = 0;
  let bDir = -1;
  let bDist = 999;

  function bfs(a, goal, local) {
    stamp++;
    let h = 0;
    let tl = 0;
    const s = a.t * N + a.y * TW + a.x;
    vis[s] = stamp;
    bq[tl++] = s;
    bfd[s] = -1;
    bdd[s] = 0;
    bDir = -1;
    bDist = 999;
    while (h < tl) {
      const u = bq[h++];
      if (u === goal) {
        bDir = bfd[u];
        bDist = bdd[u];
        return { dir: bDir, dist: bDist };
      }
      const t = (u / N) | 0;
      const rem = u - t * N;
      const y = (rem / TW) | 0;
      const x = rem - y * TW;
      for (let d = 0; d < 4; d++) {
        const nb = local ? nbrLocal(t, x, y, d) : nbr(t, x, y, d);
        if (!nb) continue;
        const v = nb.t * N + nb.y * TW + nb.x;
        if (vis[v] === stamp) continue;
        vis[v] = stamp;
        bfd[v] = u === s ? d : bfd[u];
        bdd[v] = bdd[u] + 1;
        bq[tl++] = v;
      }
    }
    return { dir: bDir, dist: bDist };
  }

  const idx = (c) => c.t * N + c.y * TW + c.x;

  return { nbr, nbrLocal, bfs, idx, get lastBfs() { return { dir: bDir, dist: bDist }; } };
}

export const mkActor = (t, x, y) => ({
  t,
  x,
  y,
  moving: false,
  dir: -1,
  nt: 0,
  nx: 0,
  ny: 0,
  prog: 0,
});

export function actorWorld(a, tiles) {
  const p = tilePos(tiles[a.t]);
  let x = p.x + a.x + 0.5;
  let y = p.y + a.y + 0.5;
  if (a.moving) {
    const q = tilePos(tiles[a.nt]);
    const x2 = q.x + a.nx + 0.5;
    const y2 = q.y + a.ny + 0.5;
    x += wrapD(x2 - x, GW) * a.prog;
    y += (y2 - y) * a.prog;
  }
  return [((x % GW) + GW) % GW, y];
}

export function actorLift(a, tiles) {
  const l0 = liftOf(tiles[a.t]);
  return a.moving ? l0 + (liftOf(tiles[a.nt]) - l0) * a.prog : l0;
}

/** Step actor along the grid (pure movement, no game rules). */
export function stepActor(a, dt, speed, choose, onArrive, nbrFn) {
  let rem = speed * dt;
  let guard = 0;
  while (rem > 1e-6 && guard++ < 6) {
    if (!a.moving) {
      const d = choose(a);
      if (d < 0) return;
      const n = nbrFn(a.t, a.x, a.y, d);
      if (!n) return;
      a.dir = d;
      a.nt = n.t;
      a.nx = n.x;
      a.ny = n.y;
      a.moving = true;
      a.prog = 0;
    }
    const need = 1 - a.prog;
    if (rem >= need) {
      rem -= need;
      a.t = a.nt;
      a.x = a.nx;
      a.y = a.ny;
      a.moving = false;
      a.prog = 0;
      if (onArrive) onArrive(a);
    } else {
      a.prog += rem;
      rem = 0;
    }
  }
}