import { describe, expect, it } from 'vitest';
import {
  TUTORIAL_STEPS,
  clampTutorialStep,
  isLastTutorialStep,
  nextTutorialStep,
  shouldAutoShowTutorial,
} from '../../src/logic/tutorial.js';

describe('tutorial', () => {
  it('auto-shows only when not seen', () => {
    expect(shouldAutoShowTutorial(false)).toBe(true);
    expect(shouldAutoShowTutorial(true)).toBe(false);
  });

  it('clamps step index', () => {
    const n = TUTORIAL_STEPS.length;
    expect(clampTutorialStep(-1, n)).toBe(0);
    expect(clampTutorialStep(99, n)).toBe(n - 1);
  });

  it('advances steps', () => {
    const n = TUTORIAL_STEPS.length;
    expect(nextTutorialStep(0, n)).toBe(1);
    expect(isLastTutorialStep(n - 1, n)).toBe(true);
    expect(isLastTutorialStep(0, n)).toBe(false);
  });
});