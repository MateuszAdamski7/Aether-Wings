import type { RefObject } from 'react';
import * as THREE from 'three';

export interface ShipSkinProps {
  fuselageRef: RefObject<THREE.Group | null>;
  canopyRef: RefObject<THREE.Mesh | null>;
  leftWingRef: RefObject<THREE.Group | null>;
  rightWingRef: RefObject<THREE.Group | null>;
  nozzleRef: RefObject<THREE.Group | null>;
  absorbMeshRef: RefObject<THREE.Group | null>;
  
  // Specific features refs
  leftChronoRingRef?: RefObject<THREE.Mesh | null>;
  rightChronoRingRef?: RefObject<THREE.Mesh | null>;
  vortexCoreRef?: RefObject<THREE.Group | null>;
}

export { VortexShip } from './skins/VortexShip';
export { QuantumShip } from './skins/QuantumShip';
export { TemporalShip } from './skins/TemporalShip';
export { PinkShip } from './skins/PinkShip';
export { CyanShip } from './skins/CyanShip';
export { YellowShip } from './skins/YellowShip';
export { GreenShip } from './skins/GreenShip';
export { PurpleShip } from './skins/PurpleShip';
export { DefaultShip } from './skins/DefaultShip';
