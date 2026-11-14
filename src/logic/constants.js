/** Grid layout, tuning, and palette — no DOM or three.js. */
export const TAU = Math.PI * 2;
export const DEG = Math.PI / 180;
export const TW = 8;
export const TH = 4;
export const COLS = 4;
export const ROWS = 4;
export const GW = TW * COLS;
export const GH = TH * ROWS;
export const N = TW * TH;
export const NT = 15;
export const LATR = 70 * DEG;
export const DECL = 0.22;
export const CW = TAU / GW;
export const CH = (2 * LATR) / GH;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
export const DIRYAW = [0, Math.PI / 2, Math.PI, -Math.PI / 2];

export const CFG = {
  dayLen: 100,
  slideT: 0.45,
  slideCool: 0.3,
  pSpeed: 4.2,
  batDay: 1.6,
  batNight: 2.5,
  batLvl: 0.06,
  batScared: 1.15,
  frightBase: 8,
  frightMin: 4,
  moteBase: 0.36,
  moteStep: 0.04,
  moteMax: 0.7,
  sunstones: 4,
  slideLight: 0.3,
  lifeEvery: 10000,
  maxBats: 9,
  radar: 12,
  comboWin: 0.8,
  sinkEvery: [16, 28],
  sinkWarn: 0.45,
  sinkOpen: 3.5,
  berryEvery: [22, 36],
  berryTTL: 14,
  boostT: 5,
  boostMul: 1.35,
};

export const PALETTE = [
  '#7cc552', '#9bd14a', '#4fae6a', '#3fa596', '#8fb07a', '#a6a34a', '#d8b44c',
  '#e09346', '#c96a4a', '#b07ab8', '#9890d8', '#6b9ee0', '#79d3b0', '#3d8a5a', '#e8828a',
];
export const BATCOL = ['#ff4f7b', '#ffae35', '#5fe6ff', '#c286ff'];
export const INSET = 0.09;
export const SLAB = 0.045;
export const LIFT = 0.07;

export function dayLenForLevel(level) {
  return Math.max(70, 95 - 5 * (level - 1));
}

export const gx2lon = (gx) => gx * CW;
export const gy2lat = (gy) => LATR - gy * CH;