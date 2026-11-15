import { describe, expect, it } from 'vitest';
import {
  planRenderLoopFrame,
  resumeClockAfterHidden,
  sceneNeedsAnimation,
} from '../../src/logic/render-loop-policy.js';

describe('render-loop-policy', () => {
  it('sceneNeedsAnimation keeps title and play active', () => {
    expect(sceneNeedsAnimation({ gameState: 'title', paused: false, tilesAnimating: false })).toBe(true);
    expect(sceneNeedsAnimation({ gameState: 'play', paused: false, tilesAnimating: false })).toBe(true);
    expect(sceneNeedsAnimation({ gameState: 'play', paused: true, tilesAnimating: false })).toBe(false);
    expect(sceneNeedsAnimation({ gameState: 'play', paused: true, tilesAnimating: true })).toBe(true);
  });

  it('stops loop when document is hidden', () => {
    const p = planRenderLoopFrame({
      documentHidden: true,
      gameState: 'title',
      paused: false,
      tilesAnimating: false,
      renderedPaused: false,
    });
    expect(p).toEqual({
      advanceClock: false,
      simulate: false,
      render: false,
      continueLoop: false,
    });
  });

  it('keeps title orbit running when visible', () => {
    const p = planRenderLoopFrame({
      documentHidden: false,
      gameState: 'title',
      paused: false,
      tilesAnimating: false,
      renderedPaused: false,
    });
    expect(p.continueLoop && p.render && p.simulate).toBe(true);
  });

  it('stops after a static pause frame', () => {
    const p = planRenderLoopFrame({
      documentHidden: false,
      gameState: 'play',
      paused: true,
      tilesAnimating: false,
      renderedPaused: true,
    });
    expect(p.continueLoop).toBe(false);
    expect(p.render).toBe(false);
  });

  it('allows one render when pause overlay opens', () => {
    const p = planRenderLoopFrame({
      documentHidden: false,
      gameState: 'play',
      paused: true,
      tilesAnimating: false,
      renderedPaused: false,
    });
    expect(p.render).toBe(true);
    expect(p.continueLoop).toBe(true);
    expect(p.simulate).toBe(false);
  });

  it('resumeClockAfterHidden returns the visible timestamp', () => {
    expect(resumeClockAfterHidden(12.5)).toBe(12.5);
  });
});