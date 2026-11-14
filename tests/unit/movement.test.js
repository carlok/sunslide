import { describe, expect, it, beforeEach } from 'vitest';
import { createMovementGraph, actorWorld } from '../../src/logic/movement.js';
import { TW, N, COLS, ROWS } from '../../src/logic/constants.js';
import { slideInstant } from '../../src/logic/slots.js';
import { generateMazeWalls } from '../../src/logic/maze.js';

function makeTiles() {
  const tiles = [];
  for (let id = 0; id < 15; id++) {
    tiles.push({
      id,
      walls: generateMazeWalls(),
      slot: { c: id % COLS, r: (id / COLS) | 0 },
      anim: null,
    });
  }
  return tiles;
}

function initSlotGrid(tiles) {
  const slotGrid = Array.from({ length: ROWS }, () => Array(COLS).fill(-1));
  let k = 0;
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++) {
      if (r === 3 && c === 3) continue;
      slotGrid[r][c] = k;
      tiles[k].slot = { c, r };
      k++;
    }
  return slotGrid;
}

describe('movement graph', () => {
  let tiles;
  let slotGrid;
  let graph;

  beforeEach(() => {
    tiles = makeTiles();
    slotGrid = initSlotGrid(tiles);
    graph = createMovementGraph(tiles, slotGrid);
  });

  it('nbrLocal stays on one island', () => {
    tiles[0].walls = new Uint8Array(N);
    const n = graph.nbrLocal(0, 1, 1, 1);
    expect(n).toEqual({ t: 0, x: 2, y: 1 });
  });

  it('crosses east seam between adjacent islands in same row', () => {
    const eastTile = 0;
    tiles[eastTile].walls = new Uint8Array(N); // open maze
    tiles[1].walls = new Uint8Array(N);
    slideInstant(slotGrid, tiles, 2, 0);
    const n = graph.nbr(eastTile, TW - 1, 1, 1);
    expect(n).toEqual({ t: 1, x: 0, y: 1 });
  });

  it('wraps column index west across the map ring', () => {
    tiles[3].walls = new Uint8Array(N);
    tiles[0].walls = new Uint8Array(N);
    slideInstant(slotGrid, tiles, 0, 3);
    const n = graph.nbr(3, TW - 1, 1, 1);
    expect(n?.t).toBe(0);
  });

  it('bfs reaches a goal across islands', () => {
    tiles[0].walls = new Uint8Array(N);
    tiles[1].walls = new Uint8Array(N);
    slideInstant(slotGrid, tiles, 2, 0);
    const start = { t: 0, x: 0, y: 0 };
    const goal = 1 * N + 2 * TW + 2;
    graph.bfs(start, goal, false);
    expect(graph.lastBfs.dist).toBeLessThan(999);
  });
});

describe('actorWorld seam wrap', () => {
  it('interpolates with east-west wrap', () => {
    const tiles = [
      { slot: { c: 0, r: 0 }, anim: null },
      { slot: { c: 1, r: 0 }, anim: null },
    ];
    const a = {
      t: 0,
      x: TW - 1,
      y: 1,
      moving: true,
      nt: 1,
      nx: 0,
      ny: 1,
      prog: 0.5,
    };
    const w = actorWorld(a, tiles);
    expect(w[0]).toBeGreaterThanOrEqual(0);
    expect(w[0]).toBeLessThan(32);
  });
});