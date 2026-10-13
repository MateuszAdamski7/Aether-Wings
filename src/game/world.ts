import type { World } from './types';
import type { RunModifiers } from '../config/modifiers';
import type { Mission } from '../store/types';
import { SPEED_CONFIG } from '../config/tuning';
import { createRNG } from './rng';

export function createWorld(
  modifiers: RunModifiers,
  activeMissions: Mission[],
  seed?: number
): World {
  return {
    player: {
      x: 0,
      z: 0,
      prevX: 0,
      prevZ: 0,
      targetX: 0,
      speed: SPEED_CONFIG.initialSpeed,
      preBoostSpeed: 0,
    },
    timers: {
      boostRemaining: 0,
      boostCharge: 0,
      blastActive: 0,
      magnetActive: 0,
      shieldRegen: 0,
    },
    shield: {
      active: modifiers.initialShieldStrength > 0,
      strength: modifiers.initialShieldStrength,
      quantumRegenerated: false, //quantum????
    },
    obstacles: [],
    crystals: [],
    powerUps: [],
    lastSpawnedZ: 150,
    distance: 0,
    score: 0,
    crystalCount: 0,
    currentSector: 1,
    collisionTriggered: false,
    runStats: { crystalsCollected: 0, boostsTriggered: 0, obstaclesCrushed: 0 },
    activeMissions: activeMissions.map((m) => ({ ...m, current: 0, completed: false })),
    modifiers,
    rng: createRNG(seed),
  };
}
