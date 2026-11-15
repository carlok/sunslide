/** First-run tutorial steps and persistence helpers (pure). */

export const TUTORIAL_SEEN_KEY = 'tutorialSeen';

export const TUTORIAL_STEPS = [
  {
    id: 'slide',
    title: 'Slide the meadow islands',
    body:
      'This is a sunlit 15-puzzle: tap a glowing island next to the empty meadow (on the planet or the map) to slide that tile into the gap. Only lit islands move.',
  },
  {
    id: 'bubbles',
    title: 'Pop bubbles, grow green',
    body:
      'Hop over bubbles to collect them. Each bubble you clear helps that island bloom — the tile turns greener as meadows spread.',
  },
  {
    id: 'goal',
    title: 'Your goal',
    body:
      'Slide every island to its home slot (1–15), wake bats with sunlight, and clear all bubbles to finish the sector. Then hop onward to the next.',
  },
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