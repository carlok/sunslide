import { CFG } from './constants.js';

/** Points for popping a bubble at combo depth n (1-based). */
export function bubblePopScore(combo) {
  return Math.min(30, 10 + 2 * Math.max(0, combo - 1));
}

/** Prism bubbles are worth five plain ones, plus the same combo bonus. */
export function prismPopScore(combo) {
  return 40 + bubblePopScore(combo);
}

/** Points for popping cell value `v` (1 plain, 3 prism) at combo depth n; home islands double it. */
export function popScore(v, combo, home) {
  const base = v === 3 ? prismPopScore(combo) : bubblePopScore(combo);
  return base * (home ? 2 : 1);
}

export function comboStillActive(comboT, dt) {
  return comboT - dt > 0;
}

export function nextComboAfterPop(combo, _comboT) {
  return { combo: combo + 1, comboT: CFG.comboWin };
}

export function resetCombo() {
  return { combo: 0, comboT: 0 };
}

export function levelClearBonus(flawless) {
  return flawless ? 2000 : 1000;
}

export function homeFirstBonus() {
  return 250;
}

export function allHomesBonus() {
  return 3000;
}