import type { World } from './types';
import type { GameEventBus } from './events';
import { movementSystem } from './systems/movementSystem';
import { spawnSystem } from './systems/spawnSystem';
import { collisionSystem } from './systems/collisionSystem';
import { crystalSystem } from './systems/crystalSystem';
import { powerupSystem } from './systems/powerupSystem';
import { boostSystem } from './systems/boostSystem';
import { missionSystem } from './systems/missionSystem';

export const FIXED_STEP = 1 / 120; // 120 Hz = 8.333 ms
const MAX_ACCUMULATOR = 0.25;

export class FixedSimulationLoop {
  private accumulator = 0;

  advance(world: World, dt: number, bus: GameEventBus): void {
    if (world.collisionTriggered) return;

    this.accumulator += Math.min(dt, MAX_ACCUMULATOR);

    while (this.accumulator >= FIXED_STEP) {
      world.player.prevX = world.player.x;
      world.player.prevZ = world.player.z;

      movementSystem(world, FIXED_STEP);
      boostSystem(world, FIXED_STEP, bus);
      spawnSystem(world);
      collisionSystem(world, bus);

      if (world.collisionTriggered) {
        this.accumulator = 0;
        return;
      }

      crystalSystem(world, FIXED_STEP, bus);
      powerupSystem(world, FIXED_STEP, bus);
      missionSystem(world, bus);

      this.accumulator -= FIXED_STEP;
    }
  }

  /** How far the simulation is into the next fixed step (0..1), used to interpolate rendering */
  get alpha(): number {
    return this.accumulator / FIXED_STEP;
  }

  reset(): void {
    this.accumulator = 0;
  }
}
