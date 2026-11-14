import { CFG } from './constants.js';

/** Points for popping a bubble at combo depth n (1-based). */
export function bubblePopScore(combo) {
  return Math.min(30, 10 + 2 * Math.max(0, combo - 1));
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