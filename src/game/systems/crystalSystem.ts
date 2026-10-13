import type { World } from '../types';
import type { GameEventBus } from '../events';
import { MAGNET_CONFIG, SHIP_HITBOX } from '../../config/tuning';

export function crystalSystem(world: World, dt: number, bus: GameEventBus): void {
  const currentShipX = world.player.x;
  const newPlayerZ = world.player.z;
  const shipWidth = SHIP_HITBOX.width;
  const shipLength = SHIP_HITBOX.length;
  const currentSpeed = world.player.speed;
  const magnetRadius = world.timers.magnetActive > 0 ? 6.0 : world.modifiers.baseMagnetRadius;

  let crystalsCollectedThisFrame = 0;
  let lastColor = '#00f3ff';
  let crystalsChanged = false;
  let newCrystals = world.crystals;

  for (let i = 0; i < newCrystals.length; i++) {
    const cry = newCrystals[i];
    if (cry.collected) continue;

    const zDiff = cry.z - newPlayerZ;
    const xDiff = cry.x - currentShipX;
    const distToShip = Math.sqrt(xDiff * xDiff + zDiff * zDiff);

    // Magnetic pull attraction: the magnet catches crystals in a zone just ahead of the ship
    const zPullThreshold = Math.max(4.0, currentSpeed * 0.12);
    if (magnetRadius > 0 && distToShip < magnetRadius && zDiff > 0 && zDiff < zPullThreshold) {
      cry.magnetized = true;
    }
    // A caught crystal closes its offset to the ship in the ship's frame of reference, so it keeps homing in
    // after the ship passes it. Pulling in world space only while it was ahead let fast ships outrun the pull,
    // leaving crystals stranded around the middle lane.
    if (cry.magnetized) {
      const keep = 1 - Math.min(1.0, dt * MAGNET_CONFIG.pullRate);
      cry.x = currentShipX + (cry.x - world.player.prevX) * keep;
      cry.z = newPlayerZ + (cry.z - world.player.prevZ) * keep;
    }

    // Direct collection bounding box check
    const finalZDiff = Math.abs(cry.z - newPlayerZ);
    const finalXDiff = Math.abs(cry.x - currentShipX);

    if (finalZDiff < shipLength / 2 + 0.8 && finalXDiff < 0.8 + shipWidth / 2) {
      if (!crystalsChanged) {
        newCrystals = [...newCrystals];
        crystalsChanged = true;
      }
      newCrystals[i] = { ...cry, collected: true };
      crystalsCollectedThisFrame++;
      lastColor = cry.color;
    }
  }

  if (crystalsChanged) {
    world.crystals = newCrystals;
  }

  if (crystalsCollectedThisFrame > 0) {
    const crystalsEarned = crystalsCollectedThisFrame * world.modifiers.crystalMultiplier;
    world.crystalCount += crystalsEarned;
    world.score += crystalsEarned * 500;
    world.runStats.crystalsCollected += crystalsEarned;

    // Charge Hyperboost gauge if not currently active
    if (world.timers.boostRemaining <= 0) {
      world.timers.boostCharge = Math.min(
        10,
        world.timers.boostCharge + crystalsEarned * world.modifiers.boostChargeRate
      );
    }

    bus.emit('crystalCollected', {
      count: crystalsCollectedThisFrame,
      earned: crystalsEarned,
      color: lastColor,
    });
  }
}
