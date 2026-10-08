import type { World } from '../types';
import type { GameEventBus } from '../events';
import { SHIP_HITBOX } from '../../config/tuning';

export function collisionSystem(world: World, bus: GameEventBus): void {
  const currentShipX = world.player.x;
  const shipWidth = SHIP_HITBOX.width;
  const shipLength = SHIP_HITBOX.length;
  const zReach = shipLength / 2 + SHIP_HITBOX.zReach;
  const prevPlayerZ = world.player.prevZ;
  const newPlayerZ = world.player.z;
  const isBoostActive = world.timers.boostRemaining > 0;

  let collisionDetected = false;
  let obstaclesDestroyedThisFrame = 0;

  for (const obs of world.obstacles) {
    const zOverlap = obs.z >= prevPlayerZ - zReach && obs.z <= newPlayerZ + zReach;
    const xDiff = Math.abs(obs.x - currentShipX);
    const xOverlap = xDiff < obs.width / 2 + shipWidth / 2;

    if (zOverlap && xOverlap) {
      if (isBoostActive) {
        obs.z = -9999;
        obstaclesDestroyedThisFrame++;
      } else if (world.shield.active) {
        obs.z = -9999;
        obstaclesDestroyedThisFrame++;
        world.shield.strength -= 1;
        if (world.shield.strength <= 0) {
          world.shield.active = false;
          world.shield.strength = 0;
        }
        bus.emit('shieldAbsorbed', { remainingStrength: world.shield.strength });
      } else {
        collisionDetected = true;
        break;
      }
    }
  }

  if (collisionDetected) {
    world.collisionTriggered = true;
    bus.emit('crash', undefined);
    return;
  }

  if (obstaclesDestroyedThisFrame > 0) {
    world.obstacles = world.obstacles.filter((o) => o.z > -9000);
    world.runStats.obstaclesCrushed += obstaclesDestroyedThisFrame;
    world.score += obstaclesDestroyedThisFrame * 1000;
  }
}
