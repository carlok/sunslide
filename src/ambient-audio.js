import { ambientLayerGains } from './logic/ambient-green.js';

const BIRD_NOTES = [72, 76, 79, 84];
const MELODY_NOTES = [67, 71, 74, 76, 79];

/**
 * Continuous WebAudio ambient bed (oscillators + looped noise). Sparse birds/melody via timers.
 * Requires game `AUD` object from virtual:sunslide-game; no extra deps.
 */
export function createAmbientController(aud, { pluck, MIDI, hash, seed = 42 } = {}) {
  let started = false;
  let musicOn = true;
  let lastTier = 0;
  let birdIv = null;
  let melIv = null;

  function ramp(gainNode, value, time, tau = 0.6) {
    if (!gainNode) return;
    gainNode.gain.setTargetAtTime(value, time, tau);
  }

  function ensureNodes() {
    if (started || !aud.ac) return false;
    const ac = aud.ac;
    const bus = ac.createGain();
    bus.gain.value = musicOn ? 0.34 : 0;
    bus.connect(aud.master);
    aud.amb = bus;

    const noiseSrc = ac.createBufferSource();
    noiseSrc.buffer = aud.noise;
    noiseSrc.loop = true;
    const windLp = ac.createBiquadFilter();
    windLp.type = 'lowpass';
    windLp.frequency.value = 520;
    const windHp = ac.createBiquadFilter();
    windHp.type = 'highpass';
    windHp.frequency.value = 120;
    const windG = ac.createGain();
    windG.gain.value = 0.0001;
    noiseSrc.connect(windHp);
    windHp.connect(windLp);
    windLp.connect(windG);
    windG.connect(bus);
    noiseSrc.start();

    const drone = ac.createOscillator();
    drone.type = 'sine';
    drone.frequency.value = 54.5;
    const droneG = ac.createGain();
    droneG.gain.value = 0.0001;
    drone.connect(droneG);
    droneG.connect(bus);
    drone.start();

    const pad1 = ac.createOscillator();
    const pad2 = ac.createOscillator();
    pad1.type = pad2.type = 'sine';
    pad1.frequency.value = 110;
    pad2.frequency.value = 164.8;
    pad2.detune.value = 6;
    const padLp = ac.createBiquadFilter();
    padLp.type = 'lowpass';
    padLp.frequency.value = 900;
    const padG = ac.createGain();
    padG.gain.value = 0.0001;
    pad1.connect(padLp);
    pad2.connect(padLp);
    padLp.connect(padG);
    padG.connect(bus);
    pad1.start();
    pad2.start();

    aud.ambLayers = { bus, windG, droneG, padG };
    started = true;
    return true;
  }

  function clearTimers() {
    if (birdIv) clearInterval(birdIv);
    if (melIv) clearInterval(melIv);
    birdIv = melIv = null;
  }

  function maybeBirdChime(tier) {
    if (!musicOn || !aud.ac || tier < 3 || !pluck) return;
    const ac = aud.ac;
    const m = BIRD_NOTES[(hash(seed, Math.floor(ac.currentTime * 2)) * BIRD_NOTES.length) | 0];
    pluck(aud.amb, m, ac.currentTime, 0.028);
  }

  function maybeMelody(tier) {
    if (!musicOn || !aud.ac || tier < 4 || !pluck) return;
    const ac = aud.ac;
    const m = MELODY_NOTES[(hash(seed, Math.floor(ac.currentTime * 3) + 9) * MELODY_NOTES.length) | 0];
    pluck(aud.amb, m, ac.currentTime, 0.032);
  }

  function scheduleSparseLayers(tier) {
    clearTimers();
    if (!musicOn || !aud.ac) return;
    if (tier >= 3) birdIv = setInterval(() => maybeBirdChime(tier), 2800);
    if (tier >= 4) melIv = setInterval(() => maybeMelody(tier), 3600);
  }

  function setPercent(percent) {
    if (!ensureNodes() && !started) return;
    if (!aud.ac || !aud.ambLayers) return;
    const g = ambientLayerGains(percent);
    const t = aud.ac.currentTime;
    const L = aud.ambLayers;
    ramp(L.windG, g.drone * 0.05, t);
    ramp(L.droneG, g.drone * 0.025, t);
    ramp(L.padG, g.pad * 0.035, t);
    const tier = g.melody > 0 ? 4 : g.birds > 0 ? 3 : g.pad > 0 ? 2 : 1;
    if (tier !== lastTier) {
      lastTier = tier;
      scheduleSparseLayers(tier);
    }
  }

  function setMusicOn(on) {
    musicOn = !!on;
    if (!aud.amb) return;
    ramp(aud.amb, on ? 0.34 : 0, aud.ac.currentTime, 0.35);
    if (!on) clearTimers();
    else if (lastTier) scheduleSparseLayers(lastTier);
  }

  function dispose() {
    clearTimers();
    try {
      aud.ambLayers?.bus?.disconnect();
    } catch {
      /* */
    }
    started = false;
    aud.amb = null;
    aud.ambLayers = null;
  }

  return { setPercent, setMusicOn, ensureNodes, dispose };
}