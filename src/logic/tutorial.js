/** First-run tutorial steps and persistence helpers (pure). */

export const TUTORIAL_SEEN_KEY = 'tutorialSeen';

export const TUTORIAL_STEPS = [
  { id: 'slide' },
  { id: 'bubbles' },
  { id: 'goal' },
];

export function shouldAutoShowTutorial(seen) {
  return seen !== true;
}

export function clampTutorialStep(index, stepCount = TUTORIAL_STEPS.length) {
  const n = Number(stepCount);
  const max = Number.isFinite(n) && n > 0 ? n - 1 : 0;
  const i = Number(index);
  if (!Number.isFinite(i)) return 0;
  return Math.max(0, Math.min(max, Math.floor(i)));
}

export function isLastTutorialStep(stepIndex, stepCount = TUTORIAL_STEPS.length) {
  return clampTutorialStep(stepIndex, stepCount) >= stepCount - 1;
}

export function nextTutorialStep(stepIndex, stepCount = TUTORIAL_STEPS.length) {
  return clampTutorialStep(stepIndex + 1, stepCount);
}