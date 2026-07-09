import * as THREE from 'three';
import { PALETTE } from '../../../config/gameConfig';
import {
  VortexShip,
  QuantumShip,
  TemporalShip,
  PinkShip,
  CyanShip,
  YellowShip,
  GreenShip,
  PurpleShip,
  DefaultShip
} from './skinsVisuals';

import type { ShipSkinProps } from './skinsVisuals';

export interface SkinVisualConfig {
  canopyProps: {
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: [number, number, number];
    geometry: THREE.BufferGeometry;
  };
  underglowColor: string;
  engineFlameColor: string;
  flameGeometryType: 'SINGLE' | 'TWIN' | 'TRIPLE';
  ShipComponent: React.ComponentType<ShipSkinProps>;
}

// Global geometries instantiated once to prevent leaks
const sphereGeomVortex = new THREE.SphereGeometry(0.13, 16, 16);
const boxGeomQuantum = new THREE.BoxGeometry(0.26, 0.05, 0.2);
const sphereGeomTemporal = new THREE.SphereGeometry(0.09, 12, 12);
const boxGeomPink = new THREE.BoxGeometry(0.14, 0.08, 0.4);
const cylinderGeomCyan = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12);
const boxGeomYellow = new THREE.BoxGeometry(0.14, 0.1, 0.32);
const boxGeomGreen = new THREE.BoxGeometry(0.18, 0.03, 0.16);
const octahedronGeomPurple = new THREE.OctahedronGeometry(0.08);
const boxGeomDefault = new THREE.BoxGeometry(0.16, 0.12, 0.5);

export const SKINS_VISUAL_REGISTRY: Record<string, SkinVisualConfig> = {
  vortex: {
    canopyProps: { position: [0, 0.14, 0.1], geometry: sphereGeomVortex },
    underglowColor: PALETTE.magenta,
    engineFlameColor: PALETTE.vortexFlame,
    flameGeometryType: 'SINGLE',
    ShipComponent: VortexShip
  },
  quantum: {
    canopyProps: { position: [0, 0.12, 0.25], geometry: boxGeomQuantum },
    underglowColor: PALETTE.quantumCyan,
    engineFlameColor: PALETTE.quantumCyan,
    flameGeometryType: 'TWIN',
    ShipComponent: QuantumShip
  },
  temporal: {
    canopyProps: { position: [0, 0.09, 0.1], geometry: sphereGeomTemporal },
    underglowColor: PALETTE.neonYellow,
    engineFlameColor: PALETTE.s2Hazard,
    flameGeometryType: 'SINGLE',
    ShipComponent: TemporalShip
  },
  pink: {
    canopyProps: { position: [0, 0.1, 0.1], geometry: boxGeomPink },
    underglowColor: PALETTE.neonPink,
    engineFlameColor: PALETTE.neonPink,
    flameGeometryType: 'SINGLE',
    ShipComponent: PinkShip
  },
  cyan: {
    canopyProps: { position: [0, 0.08, 0.0], rotation: [Math.PI / 2, 0, 0], geometry: cylinderGeomCyan },
    underglowColor: PALETTE.neonCyan,
    engineFlameColor: PALETTE.neonCyan,
    flameGeometryType: 'TRIPLE',
    ShipComponent: CyanShip
  },
  yellow: {
    canopyProps: { position: [0, 0.12, 0.1], geometry: boxGeomYellow },
    underglowColor: PALETTE.neonYellow,
    engineFlameColor: PALETTE.neonYellow,
    flameGeometryType: 'SINGLE',
    ShipComponent: YellowShip
  },
  green: {
    canopyProps: { position: [0, 0.09, 0.2], geometry: boxGeomGreen },
    underglowColor: PALETTE.neonGreen,
    engineFlameColor: PALETTE.neonGreen,
    flameGeometryType: 'SINGLE',
    ShipComponent: GreenShip
  },
  purple: {
    canopyProps: { position: [0, 0.1, 0.15], scale: [1, 0.8, 1.8], geometry: octahedronGeomPurple },
    underglowColor: PALETTE.voidPurple,
    engineFlameColor: PALETTE.voidPurple,
    flameGeometryType: 'TWIN',
    ShipComponent: PurpleShip
  },
  default: {
    canopyProps: { position: [0, 0.1, 0.1], geometry: boxGeomDefault },
    underglowColor: PALETTE.lightPurple,
    engineFlameColor: PALETTE.neonPink,
    flameGeometryType: 'SINGLE',
    ShipComponent: DefaultShip
  }
};
