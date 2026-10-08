import * as THREE from 'three';
import {
  SECTOR_1_END_Z,
  SECTOR_2_END_Z,
  S1_TRANSITION_START,
  S1_TRANSITION_END,
  S2_TRANSITION_START,
  S2_TRANSITION_END,
  TRANSITION_DISTANCE,
} from './sectors';

// Render-only sector colors (three.js), see sectors.ts for the sector layout

// 1. Track Module Colors (Single allocation per application lifetime)
export const TRACK_PALETTE = {
  s1: {
    theme: new THREE.Color('#9d00ff'), // Violet
    left: new THREE.Color('#00f3ff'),  // Cyan
    right: new THREE.Color('#ff007f'), // Hot Pink
  },
  s2: {
    theme: new THREE.Color('#ff5500'), // Neon Orange
    left: new THREE.Color('#39ff14'),  // Acid Green
    right: new THREE.Color('#ffe600'), // Solar Yellow
  },
  s3: {
    theme: new THREE.Color('#7a00ff'), // Indigo Purple
    left: new THREE.Color('#ff0000'),  // Crimson Red
    right: new THREE.Color('#9d00ff'), // Nebula Violet
  },
} as const;

// 2. Environment & Sky Module Colors
export const ENV_PALETTE = {
  s1: {
    sunBottom: new THREE.Color('#ff8c00'),
    sunTop: new THREE.Color('#ff0080'),
    fog: new THREE.Color('#03030c'),
    stars1: '#00f3ff',
    stars2: '#ff007f',
  },
  s2: {
    sunBottom: new THREE.Color('#ff5500'),
    sunTop: new THREE.Color('#ffe600'),
    fog: new THREE.Color('#011408'),
    stars1: '#39ff14',
    stars2: '#ffe600',
  },
  s3: {
    sunBottom: new THREE.Color('#7a00ff'),
    sunTop: new THREE.Color('#ff003c'),
    fog: new THREE.Color('#090214'),
    stars1: '#ff0000',
    stars2: '#7a00ff',
  },
} as const;

// 3. Mountain / Architecture Wire Colors
export const MOUNTAIN_PALETTE = {
  s1: {
    left: new THREE.Color('#00f3ff'),
    right: new THREE.Color('#ff007f'),
  },
  s2: {
    left: new THREE.Color('#39ff14'),
    right: new THREE.Color('#ffe600'),
  },
  s3: {
    left: new THREE.Color('#ff0000'),
    right: new THREE.Color('#9d00ff'),
  },
} as const;

// 4. Zero-allocation interpolation samplers
export function sampleTrackColors(
  playerZ: number,
  outTheme: THREE.Color,
  outLeft: THREE.Color,
  outRight: THREE.Color
): void {
  const { s1, s2, s3 } = TRACK_PALETTE;

  if (playerZ < S1_TRANSITION_START) {
    outTheme.copy(s1.theme);
    outLeft.copy(s1.left);
    outRight.copy(s1.right);
  } else if (playerZ < S1_TRANSITION_END) {
    const t = (playerZ - S1_TRANSITION_START) / TRANSITION_DISTANCE;
    outTheme.lerpColors(s1.theme, s2.theme, t);
    outLeft.lerpColors(s1.left, s2.left, t);
    outRight.lerpColors(s1.right, s2.right, t);
  } else if (playerZ < S2_TRANSITION_START) {
    outTheme.copy(s2.theme);
    outLeft.copy(s2.left);
    outRight.copy(s2.right);
  } else if (playerZ < S2_TRANSITION_END) {
    const t = (playerZ - S2_TRANSITION_START) / TRANSITION_DISTANCE;
    outTheme.lerpColors(s2.theme, s3.theme, t);
    outLeft.lerpColors(s2.left, s3.left, t);
    outRight.lerpColors(s2.right, s3.right, t);
  } else {
    outTheme.copy(s3.theme);
    outLeft.copy(s3.left);
    outRight.copy(s3.right);
  }
}

export function sampleEnvColors(
  playerZ: number,
  outBottom: THREE.Color,
  outTop: THREE.Color,
  outFog: THREE.Color
): void {
  const { s1, s2, s3 } = ENV_PALETTE;

  if (playerZ < S1_TRANSITION_START) {
    outBottom.copy(s1.sunBottom);
    outTop.copy(s1.sunTop);
    outFog.copy(s1.fog);
  } else if (playerZ < S1_TRANSITION_END) {
    const t = (playerZ - S1_TRANSITION_START) / TRANSITION_DISTANCE;
    outBottom.lerpColors(s1.sunBottom, s2.sunBottom, t);
    outTop.lerpColors(s1.sunTop, s2.sunTop, t);
    outFog.lerpColors(s1.fog, s2.fog, t);
  } else if (playerZ < S2_TRANSITION_START) {
    outBottom.copy(s2.sunBottom);
    outTop.copy(s2.sunTop);
    outFog.copy(s2.fog);
  } else if (playerZ < S2_TRANSITION_END) {
    const t = (playerZ - S2_TRANSITION_START) / TRANSITION_DISTANCE;
    outBottom.lerpColors(s2.sunBottom, s3.sunBottom, t);
    outTop.lerpColors(s2.sunTop, s3.sunTop, t);
    outFog.lerpColors(s2.fog, s3.fog, t);
  } else {
    outBottom.copy(s3.sunBottom);
    outTop.copy(s3.sunTop);
    outFog.copy(s3.fog);
  }
}

export function getMountainWireColor(absoluteZ: number, isRight: boolean): THREE.Color {
  const { s1, s2, s3 } = MOUNTAIN_PALETTE;
  if (absoluteZ >= SECTOR_2_END_Z) {
    return isRight ? s3.right : s3.left;
  }
  if (absoluteZ >= SECTOR_1_END_Z) {
    return isRight ? s2.right : s2.left;
  }
  return isRight ? s1.right : s1.left;
}
