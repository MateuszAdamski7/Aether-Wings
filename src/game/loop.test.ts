import { describe, expect, it } from 'vitest';
import { FIXED_STEP, FixedSimulationLoop } from './loop';
import { GameEventBus } from './events';
import { createWorld } from './world';
import { DEFAULT_RUN_MODIFIERS } from '../config/modifiers';
import type { World } from './types';

function simulate(world: World, frameDt: number, seconds: number): World {
  const loop = new FixedSimulationLoop();
  const bus = new GameEventBus();
  const frames = Math.round(seconds / frameDt);
  for (let i = 0; i < frames; i++) loop.advance(world, frameDt, bus);
  return world;
}

/** World state without the RNG closure, for deep comparison */
function snapshot(world: World) {
  return { ...world, rng: null };
}

describe('FixedSimulationLoop', () => {
  it('replays a run identically from the same seed and frame timings', () => {
    const a = simulate(createWorld(DEFAULT_RUN_MODIFIERS, [], 9), 1 / 60, 5);
    const b = simulate(createWorld(DEFAULT_RUN_MODIFIERS, [], 9), 1 / 60, 5);

    expect(snapshot(a)).toEqual(snapshot(b));
  });

  it('simulates the same run regardless of render frame rate', () => {
    const at30fps = simulate(createWorld(DEFAULT_RUN_MODIFIERS, [], 3), 1 / 30, 1);
    const at144fps = simulate(createWorld(DEFAULT_RUN_MODIFIERS, [], 3), 1 / 144, 1);

    // Both ran ~120 fixed steps; at most one step of travel apart due to the accumulator phase
    const oneStepOfTravel = at30fps.player.speed * FIXED_STEP;
    expect(Math.abs(at30fps.distance - at144fps.distance)).toBeLessThanOrEqual(oneStepOfTravel * 1.01);
  });

  it('caps catch-up after a long stall instead of simulating it all at once', () => {
    const world = createWorld(DEFAULT_RUN_MODIFIERS, [], 1);
    world.lastSpawnedZ = Number.POSITIVE_INFINITY;

    new FixedSimulationLoop().advance(world, 10, new GameEventBus());

    // At most 0.25 s worth of fixed steps
    expect(world.distance).toBeLessThan(world.player.speed * 0.26);
  });

  it('stops simulating once a collision has happened', () => {
    const world = createWorld(DEFAULT_RUN_MODIFIERS, [], 1);
    world.collisionTriggered = true;

    simulate(world, 1 / 60, 1);

    expect(world.distance).toBe(0);
  });
});
