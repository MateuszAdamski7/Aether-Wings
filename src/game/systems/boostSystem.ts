import type { World } from '../types';
import type { GameEventBus } from '../events';
import { SPEED_CONFIG, GAMEPLAY_TIMERS } from '../../config/tuning';

export function boostSystem(world: World, dt: number, bus: GameEventBus): void {
  if (world.timers.boostRemaining > 0) {
    world.timers.boostRemaining -= dt;
    const targetBoostSpeed = (world.player.preBoostSpeed || world.player.speed) + world.modifiers.boostSpeedBonus;

    if (world.timers.boostRemaining > 1.0) {
      // Smoothly accelerate to boost speed
      const t = Math.min(1.0, dt * SPEED_CONFIG.boostAccelRate);
      world.player.speed = world.player.speed + (targetBoostSpeed - world.player.speed) * t;
    } else if (world.timers.boostRemaining > 0) {
      // Smoothly decay back to pre-boost speed over the final 1.0s
      world.player.speed =
        world.player.preBoostSpeed + (targetBoostSpeed - world.player.preBoostSpeed) * world.timers.boostRemaining;
    } else {
      // Boost concluded
      world.timers.boostRemaining = 0;
      world.timers.boostCharge = 0;
      world.timers.blastActive = GAMEPLAY_TIMERS.blastWaveDuration;
      world.player.speed = world.player.preBoostSpeed;
      world.player.preBoostSpeed = 0;

      // Sonic Blast: destroy obstacles ahead
      const blastRangeZ = GAMEPLAY_TIMERS.sonicBlastRangeZ;
      const playerZ = world.player.z;
      world.obstacles = world.obstacles.filter((obs) => {
        const zDiff = obs.z - playerZ;
        return !(zDiff > 0 && zDiff < blastRangeZ);
      });

      bus.emit('blastFired', undefined);
      bus.emit('boostEnded', undefined);
    }

    world.player.targetX = 0; // Lock to middle lane during boost
  }

  if (world.timers.blastActive > 0) {
    world.timers.blastActive = Math.max(0, world.timers.blastActive - dt);
  }
}
