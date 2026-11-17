import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fragOrder = JSON.parse(
  readFileSync(path.join(__dirname, 'src/game/frag-order.json'), 'utf8'),
);

function sunslideGamePlugin() {
  const virtualId = '\0sunslide-game';
  return {
    name: 'sunslide-game-concat',
    resolveId(id) {
      if (id === 'virtual:sunslide-game') return virtualId;
    },
    load(id) {
      if (id !== virtualId) return;
      const frags = fragOrder
        .map((f) =>
          readFileSync(path.join(__dirname, 'src/game/frags', f), 'utf8'),
        )
        .join('\n\n');
      return `
import * as THREE from 'three';
import { CAMERA, closeCameraOffset, farOrbitDistance } from './src/logic/camera.js';
import { createPostPipeline } from './src/game/lazy-post.js';

import {
  createEcologyState,
  clearEcology,
  markBubbleCollected,
  ecologyCount,
  ECOLOGY,
  CELL_TANGENT,
  PATCH_THICK,
  PATCH_LIFT,
  decorLocalOffset,
  decorTangentScale,
  cellFootprintTangent,
  ecologyPatchRgb,
  ecologyGrowFactor,
} from './src/logic/ecology.js';
import { createAmbientController } from './src/ambient-audio.js';
import { ambientLayerGains } from './src/logic/ambient-green.js';
import {
  computeParMoves,
  starsForMoves,
  formatStarRow,
  recordSectorStars,
} from './src/logic/sector-stars.js';
import {
  planetGreenPercent,
  isPlanetFullyGreen,
  formatGreenPercent,
} from './src/logic/planet-green.js';
import { formatBestLine, loadStoredRunBest } from './src/logic/run-best.js';
import {
  settingsFromStore,
  resolveReducedMotion,
} from './src/logic/settings.js';
import { createStore } from './src/logic/store.js';
import { createHaptics } from './src/logic/haptics.js';
import {
  PALETTE_COLOR_BLIND,
  PALETTE_STANDARD,
  highlightTheme,
} from './src/logic/visual-theme.js';
import {
  slideSnapProgress,
  slideSnapDurationSeconds,
  slideLiftAtProgress,
  ghostPreviewBlend,
  ghostTilePosition,
  ghostEmissiveIntensity,
  movableHighlightIntensity,
  slideDeltaToHole,
  isMovableSlot,
  screenDragPull,
} from './src/logic/slide-feel.js';
import { FLOOR_CANVAS, MEADOW_CANVAS } from './src/logic/texture-budget.js';
import {
  atlasGridForCount,
  atlasRectForTile,
  mapUvToAtlas,
} from './src/logic/floor-atlas.js';
import {
  resolveShadowSettings,
  SHADOW_FRUSTUM,
  shouldUpdateShadowMap,
} from './src/logic/shadows-policy.js';
import {
  planRenderLoopFrame,
  resumeClockAfterHidden,
} from './src/logic/render-loop-policy.js';
import {
  capDevicePixelRatio,
  createAdaptiveDprState,
  effectivePixelRatio,
  syncAdaptiveCap,
  tickAdaptiveDpr,
} from './src/logic/adaptive-pixel-ratio.js';

const settingsStore = createStore();
const haptics = createHaptics();
let mapEligLitPrefix = 'rgba(255,210,94,';
let mapEligDarkStroke = 'rgba(127,140,255,0.85)';

function applyColorBlindPalette(cb) {
  const src = cb ? PALETTE_COLOR_BLIND : PALETTE_STANDARD;
  for (let i = 0; i < NT; i++) PALETTE[i] = src[i];
  applyRendererTheme(cb);
  const t = highlightTheme(!!cb);
  mapEligLitPrefix = t.mapEligLit;
  mapEligDarkStroke = cb ? 'rgba(94,176,255,0.9)' : 'rgba(127,140,255,0.85)';
  if (tiles?.length) refreshTiles();
}

function applySettings(s) {
  if (s.sound !== undefined) setMuted(!s.sound);
  if (s.music !== undefined) setMusic(!!s.music);
  if (s.haptics !== undefined) haptics.setEnabled(!!s.haptics);
  if (s.reducedMotion !== undefined) applyReducedFromSettings(s.reducedMotion);
  if (s.quality !== undefined) {
    qMode = s.quality;
    qLevel = s.quality === 'auto' ? 2 : s.quality;
    perfStart = performance.now();
    applyQuality();
  }
  if (s.colorBlind !== undefined) applyColorBlindPalette(s.colorBlind);
  syncButtons();
}

window.__ssBoot = true;

let composer=null, postPipelinePromise=null;
function ensurePostPipeline(){
  if(composer) return postPipelinePromise||Promise.resolve(composer);
  postPipelinePromise=createPostPipeline(renderer,scene,camera).then((p)=>{ composer=p.composer; if(typeof resize==='function') resize(); return composer; });
  return postPipelinePromise;
}
function schedulePostPipelineLoad(){
  if(!useBloom||composer) return;
  const run=()=>ensurePostPipeline().catch(()=>{});
  if(typeof requestIdleCallback==='function') requestIdleCallback(run,{timeout:2500});
  else setTimeout(run,400);
}

${frags}

let AMB=null;
function initAmbAudio(){
  if(AMB||!AUD.ac) return;
  AMB=createAmbientController(AUD,{pluck:(b,m,t,v)=>INS.pluck(b,m,t,v),hash,seed:MUS.seed});
  AMB.setMusicOn(MUS.on);
}
function setAmbientGreenPercent(p){
  initAmbAudio();
  AMB?.ensureNodes();
  AMB?.setPercent(p);
}
function syncAmbientMusic(){
  initAmbAudio();
  AMB?.setMusicOn(MUS.on);
}
function currentGreenPercent(){
  return planetGreenPercent(ecologyCount(ecologyState),initialGreenTarget);
}
function syncAmbientGreen(){
  if(state==='play'||state==='warp'||state==='clear')
    setAmbientGreenPercent(currentGreenPercent());
}

export function startSunslide() {
  applySettings(settingsFromStore(settingsStore));
  newLevel();
  applyQuality();
  schedulePostPipelineLoad();
  const bestEl = document.getElementById('bestline');
  if (bestEl) bestEl.textContent = formatBestLine(loadStoredRunBest(store));
  window.__sunslide = {
    get state() { return state; },
    update,
    refreshHud() {
      if (typeof hud === 'function') hud();
    },
    showClearStarsForTest(o = {}) {
      const payload = {
        sector: o.sector ?? level,
        moves: o.moves ?? runMoves,
        par: o.par ?? sectorPar,
        stars:
          o.stars ?? starsForMoves(o.moves ?? runMoves, o.par ?? sectorPar ?? 12),
      };
      if (typeof window.__ssShowClearStars === 'function') window.__ssShowClearStars(payload);
      const el = document.getElementById('clearStars');
      return {
        visible: !!(el && !el.classList.contains('hide')),
        stars: payload.stars,
        row: document.getElementById('starRow')?.textContent,
      };
    },
    startGame,
    beginDeterministicRun(seed = 0xec0107ec) {
      let a = seed >>> 0;
      const rng = () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
      const orig = Math.random;
      Math.random = rng;
      try {
        if (useBloom && typeof ensurePostPipeline === 'function') ensurePostPipeline();
        score = 0;
        lives = 3;
        level = 1;
        nextLife = CFG.lifeEvery;
        runMoves = 0;
        runTimeMs = 0;
        deaths = 0;
        newLevel();
      } finally {
        Math.random = orig;
      }
      if (typeof window.__ssHideClearStars === 'function') window.__ssHideClearStars();
      if (typeof window.__ssRefreshTitleStars === 'function') window.__ssRefreshTitleStars();
      state = 'play';
      readyT = 0;
      invuln = 1e9;
      zoomT = 1;
      perfStart = performance.now();
      if (typeof refreshShadowMap === 'function') refreshShadowMap();
      $('ov').classList.add('hide');
      $('wBlock').classList.add('hide');
      $('tBlock').classList.add('hide');
      $('oBlock').classList.add('hide');
      $('pause').classList.add('hide');
      if (typeof syncAmbientGreen === 'function') syncAmbientGreen();
    },
    goTitle,
    showWinForTest(o = {}) {
      state = 'win';
      const stats = {
        moves: o.moves ?? runMoves,
        timeMs: o.timeMs ?? Math.round(runTimeMs),
        homes: o.homes ?? tiles.filter(isHome).length,
        greened: o.greened ?? ecologyCount(ecologyState),
        level: o.level ?? level,
      };
      if (typeof window.__ssShowWin === 'function') window.__ssShowWin(stats);
      const wBlock = document.getElementById('wBlock');
      return {
        state,
        dialogOpen: !!(wBlock && !wBlock.classList.contains('hide')),
      };
    },
    trySlide,
    get bats() { return bats; },
    get player() { return player; },
    get dotsLeft() { return dotsLeft; },
    set inv(v) { invuln = v; },
    set lives(v) { lives = v; },
    killNow() { if (state === 'play') { invuln = 0; die(); } },
    clearIsland(id) {
      const T = tiles[id];
      for (let i = 0; i < N; i++) if (T.dots[i]) { T.dots[i] = 0; dotsLeft--; }
      islandCleared(T);
    },
    spawnBerry() { berryTimer = 0; },
    spawnSink() { sinkTimer = 0; },
    get sink() { return sink; },
    get berry() { return berry; },
    set waypoint(v) { waypoint = v; },
    get mood() { return MUS.mood; },
    set want(v) { want = v; },
    get tiles() { return tiles; },
    get sunLon() { return sunLon; },
    set sunLon(v) { sunLon = v; },
    get zoom() { return [zoomT, zoomTarget, viewFar]; },
    setQuality(l) { qMode = l; qLevel = l === 'auto' ? 2 : l; applyQuality(); },
    get greenedCount() { return ecologyCount(ecologyState); },
    get greenProgress() { return currentGreenPercent(); },
    get initialGreenTarget() { return initialGreenTarget; },
    get planetGreenPercent() {
      return planetGreenPercent(ecologyCount(ecologyState), initialGreenTarget);
    },
    get isPlanetFullyGreen() {
      return isPlanetFullyGreen(ecologyCount(ecologyState), initialGreenTarget);
    },
    setAmbientGreenPercent(p) { setAmbientGreenPercent(p); },
    getAmbientLayerGains(p) { return ambientLayerGains(p); },
    getEcologyLayout() { return cellFootprintTangent(); },
    popBubbleAt(t, x, y) {
      const T = tiles[t];
      if (!T) return ecologyCount(ecologyState);
      const i = y * TW + x;
      if (T.dots[i] === 1) eatAt(t, x, y);
      return ecologyCount(ecologyState);
    },
    getRenderMetrics() {
      return {
        qLevel,
        qMode,
        useBloom,
        pixelRatio,
        drawCalls: lastFrameDrawCalls,
        adaptiveDpr: adaptiveDprState.current,
        stageCss: [stageEl.clientWidth, stageEl.clientHeight],
        canvasBuffer: [glc.width, glc.height],
        composerRT: composer ? [composer.renderTarget1.width, composer.renderTarget1.height] : null,
        postPipelineReady: !!composer,
        info: renderer.info,
      };
    },
    setView,
    setCamPose(o = {}) {
      if (o.camLat != null) camLat = o.camLat;
      if (o.camLon != null) camLon = o.camLon;
      if (o.sunLon != null) sunLon = o.sunLon;
      if (o.zoomT != null) zoomT = o.zoomT;
      if (o.zoomTarget != null) zoomTarget = o.zoomTarget;
      if (o.viewFar != null) viewFar = o.viewFar;
      if (o.skyDay != null) skyDay = o.skyDay;
      if (o.state != null) state = o.state;
    },
    getCamPose() {
      return { camLat, camLon, sunLon, zoomT, zoomTarget, viewFar, skyDay, state };
    },
    get slotGrid() { return slotGrid; },
    holeNeighbors,
    isHome,
    lightSlot,
    renderInfo() { return renderer.info; },
    applySettings,
    get settings() { return settingsFromStore(settingsStore); },
    haptics,
    sampleDrawCalls() { render(); return lastFrameDrawCalls; },
  tileLightAt(tileId) {
    const T = tiles[tileId]; if (!T) return 0;
    const p = tilePos(T);
    return lightAt(p.x + TW / 2, p.y + TH / 2);
  },
  setEcologyCaptureView(tileId, lighting = 'day') {
    ecologyCaptureHold = true;
    paused = true;
    const T = tiles[tileId];
    if (!T) return getCamPose();
    const p = tilePos(T);
    const gx = p.x + TW / 2;
    const gy = p.y + TH / 2;
    const lon = gx2lon(gx);
    camLon = lon;
    camLat = gy2lat(gy) - 0.14;
    player.t = tileId;
    player.x = 3;
    player.y = 2;
    player.moving = false;
    player.nt = tileId;
    player.nx = 3;
    player.ny = 2;
    zoomT = 0;
    zoomTarget = 0;
    viewFar = false;
    state = 'play';
    sunLon = mod(lighting === 'night' ? lon + Math.PI : lon, TAU);
    ecologyCaptureSkyDay = lighting === 'night' ? 0.07 : 1;
    skyDay = ecologyCaptureSkyDay;
    syncSky();
    return {
      camLat, camLon, sunLon, zoomT, zoomTarget, viewFar, skyDay, state,
      tileLight: lightAt(gx, gy),
    };
  },
  drawCaptureFrame() {
    const t = performance.now() / 1000;
    syncScene(t, 0);
    render();
    return lastFrameDrawCalls;
  },
  releaseEcologyCaptureView() {
    ecologyCaptureHold = false;
    paused = false;
  },
  };
  wakeRenderLoop();
}
`;
    },
  };
}

export default defineConfig({
  base: '/sunslide/',
  plugins: [sunslideGamePlugin()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('postprocessing')) return 'three-post';
          if (id.includes('node_modules/three')) return 'three';
        },
      },
    },
  },
  test: {
    include: ['src/**/*.test.js', 'tests/unit/**/*.test.js'],
    coverage: {
      provider: 'v8',
      include: ['src/logic/**/*.js'],
      thresholds: {
        lines: 80,
        functions: 70,
        branches: 75,
        statements: 80,
      },
    },
  },
});