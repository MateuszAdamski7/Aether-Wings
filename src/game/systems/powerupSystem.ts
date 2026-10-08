import type { World } from '../types';
import type { GameEventBus } from '../events';
import { SHIP_HITBOX } from '../../config/tuning';

export function powerupSystem(world: World, dt: number, bus: GameEventBus): void {
  const currentShipX = world.player.x;
  const newPlayerZ = world.player.z;
  const shipWidth = SHIP_HITBOX.width;
  const shipLength = SHIP_HITBOX.length;

  // 1. Decay active magnet timer
  world.timers.magnetActive = Math.max(0, world.timers.magnetActive - dt);

  // 2. Quantum Vanguard passive shield regeneration at Z >= 1500
  if (
    world.modifiers.hasQuantumRegen &&
    !world.shield.active &&
    newPlayerZ >= 1500 &&
    !world.shield.quantumRegenerated
  ) {
    world.shield.active = true;
    world.shield.strength = Math.max(world.shield.strength, 1);
    world.shield.quantumRegenerated = true;
    bus.emit('shieldRegenerated', undefined);
  }

  // 3. Emergency Nano-Regen timer
  if (world.modifiers.hasShieldRegen && !world.shield.active) {
    if (world.timers.shieldRegen <= 0) {
      world.timers.shieldRegen = world.modifiers.shieldRegenCooldown;
    } else {
      world.timers.shieldRegen = Math.max(0, world.timers.shieldRegen - dt);
      if (world.timers.shieldRegen <= 0) {
        world.shield.active = true;
        world.shield.strength = 1;
        bus.emit('shieldRegenerated', undefined);
      }
    }
  } else {
    world.timers.shieldRegen = 0;
  }

  // 4. Power-up pickups
  let powerUpsChanged = false;
  let newPowerUps = world.powerUps;

  for (let i = 0; i < newPowerUps.length; i++) {
    const pw = newPowerUps[i];
    if (pw.collected) continue;

    const zDiff = Math.abs(pw.z - newPlayerZ);
    const xDiff = Math.abs(pw.x - currentShipX);

    if (zDiff < shipLength / 2 + 0.8 && xDiff < 0.8 + shipWidth / 2) {
      if (!powerUpsChanged) {
        newPowerUps = [...newPowerUps];
        powerUpsChanged = true;
      }
      newPowerUps[i] = { ...pw, collected: true };

      if (pw.type === 'SHIELD') {
        world.shield.active = true;
        world.shield.strength = world.modifiers.initialShieldStrength >= 2 ? 2 : 1;
        bus.emit('powerupCollected', { type: 'SHIELD' });
      } else if (pw.type === 'MAGNET') {
        world.timers.magnetActive = world.modifiers.magnetPowerupDuration;
        bus.emit('powerupCollected', { type: 'MAGNET' });
      }
      break;
    }
  }

  if (powerUpsChanged) {
    world.powerUps = newPowerUps;
  }
}
