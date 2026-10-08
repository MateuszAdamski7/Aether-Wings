import type { World } from '../types';
import { SPEED_CONFIG, CONTROL_CONFIG } from '../../config/tuning';
import { getSectorIndex } from '../../config/sectors';

const DISTANCE_POINTS_PER_UNIT = 0.1;

export function movementSystem(world: World, dt: number): void {
  // 1. Uncapped normal speed progression if boost is not controlling speed
  if (world.timers.boostRemaining <= 0) {
    world.player.speed += SPEED_CONFIG.accelerationPerSec * dt;
    world.player.preBoostSpeed = 0;
  }

  // 2. Advance player position along track
  const currentSpeed = world.player.speed;
  const prevDistancePoints = Math.floor(world.distance * DISTANCE_POINTS_PER_UNIT);
  world.player.z = world.player.prevZ + currentSpeed * dt;
  world.distance += currentSpeed * dt;

  // 3. Accumulate distance-based score. Derived from total distance so sub-point progress
  // isn't lost each step (flooring the per-step amount at 120 Hz always yielded 0).
  world.score += Math.floor(world.distance * DISTANCE_POINTS_PER_UNIT) - prevDistancePoints;

  // 4. Update biome sector index
  world.currentSector = getSectorIndex(world.player.z);

  // 5. Lateral steering toward targetX (fixed step, so collisions don't depend on render FPS)
  world.player.x += (world.player.targetX - world.player.x) * Math.min(1, dt * getLateralSpeed(world));
}

function getLateralSpeed(world: World): number {
  if (world.timers.boostRemaining > 0) return CONTROL_CONFIG.boostLerpSpeed;
  return CONTROL_CONFIG.keyboardLerpSpeed;
}
