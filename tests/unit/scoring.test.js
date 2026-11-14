import { describe, expect, it } from 'vitest';
import {
  bubblePopScore,
  nextComboAfterPop,
  levelClearBonus,
  homeFirstBonus,
  comboStillActive,
  resetCombo,
  allHomesBonus,
} from '../../src/logic/scoring.js';
import { CFG } from '../../src/logic/constants.js';

describe('scoring', () => {
  it('caps bubble pop combo bonus', () => {
    expect(bubblePopScore(1)).toBe(10);
    expect(bubblePopScore(5)).toBe(18);
    expect(bubblePopScore(100)).toBe(30);
  });

  it('extends combo window', () => {
    const n = nextComboAfterPop(2, 0.1);
    expect(n.combo).toBe(3);
    expect(n.comboT).toBe(CFG.comboWin);
  });

  it('level clear bonus', () => {
    expect(levelClearBonus(true)).toBe(2000);
    expect(levelClearBonus(false)).toBe(1000);
  });

  it('home first arrival', () => {
    expect(homeFirstBonus()).toBe(250);
  });

  it('tracks combo timer', () => {
    expect(comboStillActive(0.5, 0.1)).toBe(true);
    expect(comboStillActive(0.1, 0.2)).toBe(false);
  });

  it('resets combo state', () => {
    expect(resetCombo()).toEqual({ combo: 0, comboT: 0 });
  });

  it('all homes bonus', () => {
    expect(allHomesBonus()).toBe(3000);
  });
});