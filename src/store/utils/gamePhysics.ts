import type { Obstacle, Crystal, PowerUp, ShipModifier } from '../types';
import { SPAWN_INTERVAL, CLEANUP_THRESHOLD_Z } from '../../config/gameConfig';
import { audioManager } from '../../utils/audio';
import { spawnChunk } from './obstacleSpawner';
import { checkObstacleCollisions, checkCrystalCollisions, checkPowerUpCollisions } from './collisionSystem';

export interface BoostAndSpeedParams {
  boostActive: boolean;
  boostTimeRemaining: number;
  boostCharge: number;
  blastActiveTime: number;
  targetX: number;
  preBoostSpeed: number;
  speed: number;
  maxSpeed: number;
  playerZ: number;
  obstacles: Obstacle[];
  physicsDt: number;
  activeModifiers: ShipModifier[];
}

export interface BoostAndSpeedResult {
  currentSpeed: number;
  nextBoostActive: boolean;
  nextBoostTime: number;
  nextBoostCharge: number;
  nextBlastActiveTime: number;
  nextTargetX: number;
  nextPreBoostSpeed: number;
  newObstacles: Obstacle[];
}

export const updateBoostAndSpeed = ({
  boostActive,
  boostTimeRemaining,
  boostCharge,
  blastActiveTime,
  targetX,
  preBoostSpeed,
  speed,
  maxSpeed,
  playerZ,
  obstacles,
  physicsDt,
  activeModifiers,
}: BoostAndSpeedParams): BoostAndSpeedResult => {
  let currentSpeed: number;
  let nextBoostActive = boostActive;
  let nextBoostTime = boostTimeRemaining;
  let nextBoostCharge = boostCharge;
  let nextBlastActiveTime = blastActiveTime;
  let nextTargetX = targetX;
  let nextPreBoostSpeed = preBoostSpeed;
  let newObstacles = [...obstacles];

  if (boostActive) {
    nextBoostTime = boostTimeRemaining - physicsDt;
    const extraBoostSpeed = activeModifiers.reduce(
      (s, mod) => mod.modifyExtraBoostSpeed ? mod.modifyExtraBoostSpeed(s) : s,
      25
    );
    const targetBoostSpeed = maxSpeed + extraBoostSpeed;

    if (nextBoostTime > 1.0) {
      const t = Math.min(1.0, physicsDt * 2.8);
      currentSpeed = speed + (targetBoostSpeed - speed) * t;
    } else if (nextBoostTime > 0) {
      currentSpeed = preBoostSpeed + (targetBoostSpeed - preBoostSpeed) * nextBoostTime;
    } else {
      nextBoostActive = false;
      nextBoostTime = 0;
      nextBoostCharge = 0;
      nextBlastActiveTime = 0.45;
      currentSpeed = preBoostSpeed;
      nextPreBoostSpeed = 0;

      const blastRangeZ = 80;
      newObstacles = newObstacles.map((obs) => {
        const zDiff = obs.z - playerZ;
        if (zDiff > 0 && zDiff < blastRangeZ) {
          return { ...obs, destroyed: true };
        }
        return obs;
      });
      audioManager.playBlastFx();
    }
    nextTargetX = 0;
  } else {
    const speedIncrease = 0.4 * physicsDt;
    currentSpeed = Math.min(maxSpeed, speed + speedIncrease);
    nextPreBoostSpeed = 0;
  }

  return {
    currentSpeed,
    nextBoostActive,
    nextBoostTime,
    nextBoostCharge,
    nextBlastActiveTime,
    nextTargetX,
    nextPreBoostSpeed,
    newObstacles,
  };
};

export interface SpawningAndCleanupParams {
  lastSpawnedZ: number;
  playerZ: number;
  obstacles: Obstacle[];
  crystals: Crystal[];
  powerUps: PowerUp[];
}

export interface SpawningAndCleanupResult {
  nextSpawnZ: number;
  newObstacles: Obstacle[];
  newCrystals: Crystal[];
  newPowerUps: PowerUp[];
}

export const handleSpawningAndCleanup = ({
  lastSpawnedZ,
  playerZ,
  obstacles,
  crystals,
  powerUps,
}: SpawningAndCleanupParams): SpawningAndCleanupResult => {
  let nextSpawnZ = lastSpawnedZ;
  let newObstacles = [...obstacles];
  let newCrystals = [...crystals];
  let newPowerUps = [...powerUps];

  if (playerZ + SPAWN_INTERVAL * 5 > nextSpawnZ) {
    spawnChunk(nextSpawnZ, newObstacles, newCrystals, newPowerUps);
    nextSpawnZ += SPAWN_INTERVAL;
  }

  newObstacles = newObstacles.filter((o) => o.z > playerZ - CLEANUP_THRESHOLD_Z && !o.destroyed);
  newCrystals = newCrystals.filter((c) => c.z > playerZ - CLEANUP_THRESHOLD_Z && !c.collected);
  newPowerUps = newPowerUps.filter((pw) => pw.z > playerZ - CLEANUP_THRESHOLD_Z && !pw.collected);

  return {
    nextSpawnZ,
    newObstacles,
    newCrystals,
    newPowerUps,
  };
};

export interface CollisionTickParams {
  obstacles: Obstacle[];
  crystals: Crystal[];
  powerUps: PowerUp[];
  playerZ: number;
  shipX: number;
  boostActive: boolean;
  shieldActive: boolean;
  shieldStrength: number;
  magnetActiveTime: number;
  slowMoActiveTime: number;
  currentSpeed: number;
  physicsDt: number;
  getMagnetRadius: (nextMagnetActiveTime: number) => number;
  activeModifiers: ShipModifier[];
}

export interface CollisionTickResult {
  collisionDetected: boolean;
  shieldActive: boolean;
  shieldStrength: number;
  obstaclesDestroyedCount: number;
  newObstacles: Obstacle[];
  crystalsCollectedCount: number;
  newCrystals: Crystal[];
  magnetActiveTime: number;
  slowMoActiveTime: number;
  newPowerUps: PowerUp[];
}

export const handleCollisions = ({
  obstacles,
  crystals,
  powerUps,
  playerZ,
  shipX,
  boostActive,
  shieldActive,
  shieldStrength,
  magnetActiveTime,
  slowMoActiveTime,
  currentSpeed,
  physicsDt,
  getMagnetRadius,
  activeModifiers,
}: CollisionTickParams): CollisionTickResult => {
  const shipWidth = 1.0;
  const shipLength = 1.5;

  let newObstacles = [...obstacles];
  const newCrystals = [...crystals];
  const newPowerUps = [...powerUps];

  const obsResult = checkObstacleCollisions({
    obstacles: newObstacles,
    playerZ,
    shipX,
    shipLength,
    shipWidth,
    boostActive,
    shieldActive,
    shieldStrength,
  });

  if (obsResult.collisionDetected) {
    return {
      collisionDetected: true,
      shieldActive,
      shieldStrength,
      obstaclesDestroyedCount: 0,
      newObstacles,
      crystalsCollectedCount: 0,
      newCrystals,
      magnetActiveTime,
      slowMoActiveTime,
      newPowerUps,
    };
  }

  let nextShieldActive = obsResult.shieldActive;
  let nextShieldStrength = obsResult.shieldStrength;
  const obstaclesDestroyedCount = obsResult.obstaclesDestroyed;

  if (obstaclesDestroyedCount > 0) {
    newObstacles = newObstacles.filter((o) => !o.destroyed);
  }

  const magnetRadius = getMagnetRadius(magnetActiveTime);

  const cryResult = checkCrystalCollisions({
    crystals: newCrystals,
    playerZ,
    shipX,
    shipLength,
    shipWidth,
    magnetRadius,
    currentSpeed,
    physicsDt,
  });
  const crystalsCollectedCount = cryResult.crystalsCollected;

  const shieldCapacity = activeModifiers.reduce(
    (c, mod) => mod.modifyShieldPowerUpCapacity ? mod.modifyShieldPowerUpCapacity(c) : c,
    1
  );
  const magnetDuration = activeModifiers.reduce(
    (d, mod) => mod.modifyMagnetPowerUpDuration ? mod.modifyMagnetPowerUpDuration(d) : d,
    8.0
  );
  const slowMoDuration = activeModifiers.reduce(
    (d, mod) => mod.modifySlowMoPowerUpDuration ? mod.modifySlowMoPowerUpDuration(d) : d,
    5.0
  );

  const pwResult = checkPowerUpCollisions({
    powerUps: newPowerUps,
    playerZ,
    shipX,
    shipLength,
    shipWidth,
    shieldCapacity,
    magnetDuration,
    slowMoDuration,
  });

  let nextMagnetActiveTime = magnetActiveTime;
  let nextSlowMoActiveTime = slowMoActiveTime;

  if (pwResult.shieldActive !== null) {
    nextShieldActive = pwResult.shieldActive;
    nextShieldStrength = pwResult.shieldStrength ?? 1;
  }
  if (pwResult.magnetActiveTime !== null) {
    nextMagnetActiveTime = pwResult.magnetActiveTime;
  }
  if (pwResult.slowMoActiveTime !== null) {
    nextSlowMoActiveTime = pwResult.slowMoActiveTime;
  }

  return {
    collisionDetected: false,
    shieldActive: nextShieldActive,
    shieldStrength: nextShieldStrength,
    obstaclesDestroyedCount,
    newObstacles,
    crystalsCollectedCount,
    newCrystals,
    magnetActiveTime: nextMagnetActiveTime,
    slowMoActiveTime: nextSlowMoActiveTime,
    newPowerUps,
  };
};
