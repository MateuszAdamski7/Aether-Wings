import type { Obstacle, Crystal, PowerUp, GameStoreUpgrades } from '../types';
import { audioManager } from '../../utils/audio';

export interface ObstacleCollisionResult {
  collisionDetected: boolean;
  shieldActive: boolean;
  shieldStrength: number;
  obstaclesDestroyed: number;
}

export const checkObstacleCollisions = (
  obstacles: Obstacle[],
  playerZ: number,
  shipX: number,
  shipLength: number,
  shipWidth: number,
  boostActive: boolean,
  shieldActive: boolean,
  shieldStrength: number
): ObstacleCollisionResult => {
  let collisionDetected = false;
  let shieldActiveState = shieldActive;
  let shieldStrengthState = shieldStrength;
  let obstaclesDestroyed = 0;

  for (const obs of obstacles) {
    const zDiff = Math.abs(obs.z - playerZ);
    const xDiff = Math.abs(obs.x - shipX);

    if (zDiff < (shipLength / 2 + 0.6) && xDiff < (obs.width / 2 + shipWidth / 2)) {
      if (boostActive) {
        obs.z = -9999;
        obstaclesDestroyed++;
      } else if (shieldActiveState) {
        obs.z = -9999;
        if (shieldStrengthState > 1) {
          shieldStrengthState = 1;
          audioManager.playShieldShatterFx();
        } else {
          shieldActiveState = false;
          shieldStrengthState = 0;
          audioManager.playShieldShatterFx();
        }
      } else {
        collisionDetected = true;
        break;
      }
    }
  }

  return {
    collisionDetected,
    shieldActive: shieldActiveState,
    shieldStrength: shieldStrengthState,
    obstaclesDestroyed,
  };
};

export interface CrystalCollisionResult {
  crystalsCollected: number;
}

export const checkCrystalCollisions = (
  crystals: Crystal[],
  playerZ: number,
  shipX: number,
  shipLength: number,
  shipWidth: number,
  magnetRadius: number,
  currentSpeed: number,
  physicsDt: number
): CrystalCollisionResult => {
  let crystalsCollected = 0;

  for (const cry of crystals) {
    if (cry.collected) continue;

    const zDiff = cry.z - playerZ;
    const xDiff = cry.x - shipX;
    const distToShip = Math.sqrt(xDiff * xDiff + zDiff * zDiff);

    const zPullThreshold = Math.max(4.0, currentSpeed * 0.12);
    if (magnetRadius > 0 && distToShip < magnetRadius && zDiff > 0 && zDiff < zPullThreshold) {
      // Attract crystals to ship with a snappy arcade pull rate
      const pull = Math.min(1.0, physicsDt * 16.0);
      cry.x += (shipX - cry.x) * pull;
      cry.z += (playerZ - cry.z) * pull * 0.5;
    }

    const finalZDiff = Math.abs(cry.z - playerZ);
    const finalXDiff = Math.abs(cry.x - shipX);

    if (finalZDiff < (shipLength / 2 + 0.8) && finalXDiff < (0.8 + shipWidth / 2)) {
      cry.collected = true;
      crystalsCollected++;
      audioManager.playCollectFx();
    }
  }

  return { crystalsCollected };
};

export interface PowerUpCollisionResult {
  shieldActive: boolean | null;
  shieldStrength: number | null;
  magnetActiveTime: number | null;
  slowMoActiveTime: number | null;
}

//todo: upgrades just like in gameSlice, powerups should be objects, implement factory for upgraades
export const checkPowerUpCollisions = (
  powerUps: PowerUp[],
  playerZ: number,
  shipX: number,
  shipLength: number,
  shipWidth: number,
  upgrades: GameStoreUpgrades
): PowerUpCollisionResult => {
  let shieldActive: boolean | null = null;
  let shieldStrength: number | null = null;
  let magnetActiveTime: number | null = null;
  let slowMoActiveTime: number | null = null;

  for (const pw of powerUps) {
    if (pw.collected) continue;
    const zDiff = Math.abs(pw.z - playerZ);
    const xDiff = Math.abs(pw.x - shipX);

    if (zDiff < (shipLength / 2 + 0.8) && xDiff < (0.8 + shipWidth / 2)) {
      pw.collected = true;
      if (pw.type === 'SHIELD') {
        shieldActive = true;
        shieldStrength = upgrades.defense_shield_2 ? 2 : 1;
        audioManager.playShieldPickupFx();
      } else if (pw.type === 'MAGNET') {
        const extraTime = upgrades.harvest_magnet_2 ? 3.0 : 0.0;
        magnetActiveTime = 8.0 + extraTime;
        audioManager.playMagnetPickupFx();
      } else if (pw.type === 'SLOWMO') {
        // Temporal Warp Wing passive: 8s slow-mo duration instead of 5s
        const baseDuration = upgrades.equippedSkin === 'temporal' ? 8.0 : 5.0;
        const extraDuration = upgrades.engine_boost_3 ? 2.0 : 0.0;
        slowMoActiveTime = baseDuration + extraDuration;
        audioManager.playSlowMoPickupFx();
      }
    }
  }

  return {
    shieldActive,
    shieldStrength,
    magnetActiveTime,
    slowMoActiveTime,
  };
};
