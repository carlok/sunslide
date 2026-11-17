import { describe, expect, it } from 'vitest';
import {
  deviceAllowsShadows,
  resolveShadowSettings,
  shadowMapResolution,
  shouldUpdateShadowMap,
} from '../../src/logic/shadows-policy.js';

describe('shadows-policy', () => {
  it('disables shadows on low quality tier', () => {
    expect(deviceAllowsShadows({ qualityShadow: 0, coarsePointer: false, hardwareConcurrency: 8 })).toBe(false);
  });

  it('disables on coarse low-memory devices', () => {
    expect(
      deviceAllowsShadows({
        qualityShadow: 1024,
        coarsePointer: true,
        hardwareConcurrency: 4,
        deviceMemory: 2,
      }),
    ).toBe(false);
  });

  it('picks 512 on mobile coarse pointer', () => {
    expect(
      shadowMapResolution({
        qualityShadow: 2048,
        coarsePointer: true,
        hardwareConcurrency: 8,
        deviceMemory: 8,
      }),
    ).toBe(512);
  });

  it('picks 1024 on desktop', () => {
    expect(
      shadowMapResolution({
        qualityShadow: 2048,
        coarsePointer: false,
        hardwareConcurrency: 8,
        viewportWidth: 1280,
      }),
    ).toBe(1024);
  });

  it('caps quality preset to tier resolution', () => {
    expect(
      resolveShadowSettings({
        qualityShadow: 2048,
        coarsePointer: false,
        hardwareConcurrency: 8,
        viewportWidth: 1920,
      }),
    ).toEqual({ enabled: true, mapSize: 1024 });
  });

  it('updates shadow map during slide and title orbit', () => {
    expect(
      shouldUpdateShadowMap({
        shadowsEnabled: true,
        gameState: 'title',
        paused: false,
        tilesAnimating: false,
      }),
    ).toBe(true);
    expect(
      shouldUpdateShadowMap({
        shadowsEnabled: true,
        gameState: 'play',
        paused: false,
        tilesAnimating: true,
      }),
    ).toBe(true);
    expect(
      shouldUpdateShadowMap({
        shadowsEnabled: true,
        gameState: 'play',
        paused: true,
        tilesAnimating: false,
      }),
    ).toBe(false);
    expect(
      shouldUpdateShadowMap({
        shadowsEnabled: true,
        gameState: 'win',
        paused: false,
        tilesAnimating: false,
      }),
    ).toBe(true);
  });

  it('never redraws the shadow map while paused, even mid-slide or mid-warp', () => {
    for (const gameState of ['play', 'warp', 'dying', 'clear']) {
      expect(
        shouldUpdateShadowMap({ shadowsEnabled: true, gameState, paused: true, tilesAnimating: true }),
      ).toBe(false);
    }
  });

  it('skips shadow updates when shadows are disabled', () => {
    expect(
      shouldUpdateShadowMap({ shadowsEnabled: false, gameState: 'title', paused: false, tilesAnimating: true }),
    ).toBe(false);
  });
});