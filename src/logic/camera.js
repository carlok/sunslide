/** Chase-camera tuning (degrees / world units). Game frags import via Vite bundle. */
import { DEG } from './constants.js';

export const CAMERA = {
  /** Close follow: radial offset from look target on the sphere. */
  followDistance: 1.05,
  /** Elevation above local horizon (lower = less top-down). */
  pitchDeg: 47,
  /** Look target offset along surface normal from player. */
  lookTargetLift: 0.1,
  /** Orbit / planet view minimum radius. */
  farMinDistance: 2.55,
  farHorizonTanDeg: 19,
  farHorizonFactor: 1.2,
  farCamLatScale: 0.55,
  titleCamLat: 0.3,
  fovCloseDeg: 46,
  fovFarDeg: 38,
};

/** Components for close camera offset along tangent (+E1) and inward normal (-N). */
export function closeCameraOffset(
  distance = CAMERA.followDistance,
  pitchDeg = CAMERA.pitchDeg,
) {
  const pitch = pitchDeg * DEG;
  return {
    alongTangent: distance * Math.sin(pitch),
    alongNormal: -distance * Math.cos(pitch),
  };
}

export function farOrbitDistance(aspect, cam = CAMERA) {
  const a = Math.min(1, aspect);
  const tan = Math.tan(cam.farHorizonTanDeg * DEG) * a;
  return Math.max(cam.farMinDistance, cam.farHorizonFactor / tan);
}