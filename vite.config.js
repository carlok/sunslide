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
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

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
} from './src/logic/ecology.js';
import { createAmbientController } from './src/ambient-audio.js';
import { planetGreenPercent } from './src/logic/planet-green.js';
import { ambientLayerGains } from './src/logic/ambient-green.js';

window.__ssBoot = true;

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
  newLevel();
  applyQuality();
  const bestEl = document.getElementById('bestline');
  if (bestEl) bestEl.textContent = best ? 'Best: ' + best : '';
  window.__sunslide = {
    get state() { return state; },
    update,
    startGame,
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
        stageCss: [stageEl.clientWidth, stageEl.clientHeight],
        canvasBuffer: [glc.width, glc.height],
        composerRT: [composer.renderTarget1.width, composer.renderTarget1.height],
      };
    },
    setView,
    get slotGrid() { return slotGrid; },
    holeNeighbors,
    isHome,
    lightSlot,
    renderInfo() { return renderer.info; },
  };
  requestAnimationFrame(frame);
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