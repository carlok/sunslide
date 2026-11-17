/** Pure policy for when to simulate, render, and keep the rAF loop alive. */

/**
 * Scenes that should keep animating while visible (title orbit, warp, etc.).
 * Paused scenes never do: slides, warps and deaths only advance in update(), which doesn't run
 * while paused, so re-rendering them just burns a full frame (and a shadow pass) at 60 fps.
 */
export function sceneNeedsAnimation({ gameState, paused, tilesAnimating }) {
  if (paused) return false;
  if (tilesAnimating) return true;
  if (gameState === 'title' || gameState === 'over') return true;
  if (gameState === 'warp' || gameState === 'dying' || gameState === 'clear') return true;
  if (gameState === 'play' && !paused) return true;
  return false;
}

/**
 * @returns {{
 *   advanceClock: boolean,
 *   simulate: boolean,
 *   render: boolean,
 *   continueLoop: boolean,
 * }}
 */
export function planRenderLoopFrame(ctx) {
  const {
    documentHidden,
    gameState,
    paused,
    tilesAnimating,
    renderedPaused,
  } = ctx;

  if (documentHidden) {
    return {
      advanceClock: false,
      simulate: false,
      render: false,
      continueLoop: false,
    };
  }

  const animating = sceneNeedsAnimation({ gameState, paused, tilesAnimating });

  if (paused && renderedPaused && !animating) {
    return {
      advanceClock: false,
      simulate: false,
      render: false,
      continueLoop: false,
    };
  }

  if (paused && !renderedPaused) {
    return {
      advanceClock: false,
      simulate: false,
      render: true,
      continueLoop: true,
    };
  }

  return {
    advanceClock: true,
    simulate: !paused,
    render: true,
    continueLoop: true,
  };
}

/** After tab becomes visible again: align sim clock so the next frame has no dt spike. */
export function resumeClockAfterHidden(performanceNowSec) {
  return performanceNowSec;
}