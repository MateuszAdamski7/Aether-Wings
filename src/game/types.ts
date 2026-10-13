import type { Obstacle, Crystal, PowerUp, Mission, RunStats } from '../store/types';
import type { RunModifiers } from '../config/modifiers';

export interface WorldPlayer {
  x: number;
  z: number;
  /** Position at the start of the latest fixed step (swept collisions, render interpolation) */
  prevX: number;
  prevZ: number;
  targetX: number;
  speed: number;
  preBoostSpeed: number;
}

export interface WorldTimers {
  boostRemaining: number;
  boostCharge: number;
  blastActive: number;
  magnetActive: number;
  shieldRegen: number;
}

export interface WorldShield {
  active: boolean;
  strength: number;
  quantumRegenerated: boolean;
}

export interface World {
  player: WorldPlayer;
  timers: WorldTimers;
  shield: WorldShield;
  obstacles: Obstacle[];
  crystals: Crystal[];
  powerUps: PowerUp[];
  lastSpawnedZ: number;
  distance: number;
  score: number;
  crystalCount: number;
  currentSector: 1 | 2 | 3;
  collisionTriggered: boolean;
  runStats: RunStats;
  activeMissions: Mission[];
  modifiers: RunModifiers;
  rng: () => number;
}

export interface GameEventMap {
  crash: undefined;
  crystalCollected: { count: number; earned: number; color: string };
  powerupCollected: { type: 'SHIELD' | 'MAGNET' };
  shieldAbsorbed: { remainingStrength: number };
  shieldRegenerated: undefined;
  blastFired: undefined;
  boostActivated: undefined;
  boostEnded: undefined;
  missionCompleted: { id: string; description: string; reward: number };
}
