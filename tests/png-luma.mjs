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

/** Sample center play area; fail if avg luma too low or too many near-black pixels. */
export function analyzeStagePng(buf, { blackLuma = 8, minMeanLuma = 22 } = {}) {
  const { width: w, height: h, data } = decodePngRgba(buf);
  let sum = 0;
  let n = 0;
  let black = 0;
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
      if (l < blackLuma) black++;
    }
  }
  const mean = sum / n;
  const blackFrac = black / n;
  const catastrophic = mean < 14 && blackFrac > 0.92;
  const ok = mean >= minMeanLuma && !catastrophic;
  return { width: w, height: h, mean, blackFrac, catastrophic, ok, samples: n };
}