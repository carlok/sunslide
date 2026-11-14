/** Mean luma + center black fraction for a PNG buffer (dependency-free IDAT parser). */
import { inflateSync } from 'node:zlib';

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

function decodePngRgba(buf) {
  if (buf[0] !== 0x89 || buf.toString('ascii', 1, 4) !== 'PNG') {
    throw new Error('not a PNG');
  }
  let off = 8;
  let w = 0;
  let h = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    off += 4;
    const type = buf.toString('ascii', off, off + 4);
    off += 4;
    const data = buf.subarray(off, off + len);
    off += len + 4;
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
    } else if (type === 'IDAT') {
      idat.push(data);
    } else if (type === 'IEND') {
      break;
    }
  }
  const raw = inflateSync(Buffer.concat(idat));
  const bytes = w * h * 4;
  const out = new Uint8Array(bytes);
  let prev = new Uint8Array(w * 4);
  let row = new Uint8Array(w * 4);
  let rawOff = 0;
  for (let y = 0; y < h; y++) {
    const filter = raw[rawOff++];
    for (let x = 0; x < w * 4; x++) row[x] = raw[rawOff++];
    if (filter === 1) {
      for (let x = 4; x < w * 4; x++) row[x] = (row[x] + row[x - 4]) & 0xff;
    } else if (filter === 2) {
      for (let x = 0; x < w * 4; x++) row[x] = (row[x] + prev[x]) & 0xff;
    } else if (filter === 3) {
      for (let x = 0; x < w * 4; x++) {
        const left = x >= 4 ? row[x - 4] : 0;
        const up = prev[x];
        row[x] = (row[x] + Math.floor((left + up) / 2)) & 0xff;
      }
    } else if (filter === 4) {
      for (let x = 0; x < w * 4; x++) {
        const left = x >= 4 ? row[x - 4] : 0;
        const up = prev[x];
        const upLeft = x >= 4 ? prev[x - 4] : 0;
        row[x] = (row[x] + paeth(left, up, upLeft)) & 0xff;
      }
    }
    out.set(row, y * w * 4);
    prev = row;
    row = new Uint8Array(w * 4);
  }
  return { width: w, height: h, data: out };
}

function blockStats(data, w, x0, y0, size) {
  let sum = 0;
  let n = 0;
  let min = 255;
  let max = 0;
  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      const i = (y * w + x) * 4;
      const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += l;
      n++;
      if (l < min) min = l;
      if (l > max) max = l;
    }
  }
  return { mean: sum / n, min, max, spread: max - min };
}

/** Detect unresolved MSAA / macro-tile black blobs amid an otherwise lit scene. */
export function detectMacroBlackTiles(data, w, h) {
  const block = Math.max(14, Math.floor(Math.min(w, h) / 56));
  const bx0 = Math.floor(w * 0.14);
  const bx1 = Math.floor(w * 0.86) - block;
  const by0 = Math.floor(h * 0.12);
  const by1 = Math.floor(h * 0.88) - block;
  const cols = Math.floor((bx1 - bx0) / block) + 1;
  const rows = Math.floor((by1 - by0) / block) + 1;
  const dead = new Uint8Array(cols * rows);
  let brightSamples = 0;
  let totalSamples = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x0 = bx0 + col * block;
      const y0 = by0 + row * block;
      const { mean, spread } = blockStats(data, w, x0, y0, block);
      const isDead = spread < 2.5 && mean < 5;
      dead[row * cols + col] = isDead ? 1 : 0;
      totalSamples++;
      if (mean > 55 || spread > 40) brightSamples++;
    }
  }
  const visited = new Uint8Array(cols * rows);
  let largestDead = 0;
  const neigh = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < dead.length; i++) {
    if (!dead[i] || visited[i]) continue;
    let stack = [i];
    let area = 0;
    visited[i] = 1;
    while (stack.length) {
      const cur = stack.pop();
      area++;
      const cr = Math.floor(cur / cols);
      const cc = cur % cols;
      for (const [dr, dc] of neigh) {
        const nr = cr + dr;
        const nc = cc + dc;
        if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue;
        const ni = nr * cols + nc;
        if (dead[ni] && !visited[ni]) {
          visited[ni] = 1;
          stack.push(ni);
        }
      }
    }
    if (area > largestDead) largestDead = area;
  }
  const deadAreaFrac = (largestDead * block * block) / (w * h);
  const hasBrightSignal = brightSamples / Math.max(1, totalSamples) > 0.04;
  const failed = hasBrightSignal && deadAreaFrac > 0.1;
  return { block, largestDeadBlocks: largestDead, deadAreaFrac, hasBrightSignal, failed };
}

/** Regression for large-desktop MSAA macro-tiles (not global scene darkness). */
export function analyzeStagePng(buf) {
  const { width: w, height: h, data } = decodePngRgba(buf);
  let sum = 0;
  let n = 0;
  let black = 0;
  let hi = 0;
  const step = Math.max(2, Math.floor(Math.min(w, h) / 180));
  const x0 = Math.floor(w * 0.12);
  const x1 = Math.floor(w * 0.88);
  const y0 = Math.floor(h * 0.1);
  const y1 = Math.floor(h * 0.9);
  for (let y = y0; y < y1; y += step) {
    for (let x = x0; x < x1; x += step) {
      const i = (y * w + x) * 4;
      const l = (data[i] + data[i + 1] + data[i + 2]) / 3;
      sum += l;
      n++;
      if (l < 8) black++;
      if (l > 80) hi++;
    }
  }
  const mean = sum / n;
  const blackFrac = black / n;
  const hiFrac = hi / n;
  const macro = detectMacroBlackTiles(data, w, h);
  const noScene = mean < 14 && hiFrac < 0.002;
  const ok = !macro.failed && !noScene;
  return {
    width: w,
    height: h,
    mean,
    blackFrac,
    hiFrac,
    macro,
    noScene,
    ok,
    samples: n,
  };
}