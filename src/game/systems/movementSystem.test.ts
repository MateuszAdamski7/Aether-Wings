import { describe, expect, it } from 'vitest';
import { movementSystem } from './movementSystem';
import { FIXED_STEP } from '../loop';
import { makeWorld, placePlayer } from '../testing';
import { SPEED_CONFIG } from '../../config/tuning';
import { SECTOR_1_END_Z, SECTOR_2_END_Z } from '../../config/sectors';
import type { World } from '../types';

function step(world: World, dt = FIXED_STEP): void {
  world.player.prevZ = world.player.z;
  movementSystem(world, dt);
}

describe('movementSystem', () => {
  it('moves the ship forward and keeps accelerating outside Hyperboost', () => {
    const world = makeWorld();

    step(world, 0.5);

    expect(world.player.speed).toBeCloseTo(SPEED_CONFIG.initialSpeed + SPEED_CONFIG.accelerationPerSec * 0.5);
    expect(world.player.z).toBeCloseTo(world.player.speed * 0.5);
    expect(world.distance).toBeCloseTo(world.player.z);
  });

  it('leaves speed to the boost system while Hyperboost is active', () => {
    const world = makeWorld();
    world.timers.boostRemaining = 3;
    world.player.speed = 50;

    step(world, 0.5);

    expect(world.player.speed).toBe(50);
  });

  it('awards one point per 10 units even when each step covers less than that', () => {
    const world = makeWorld();

    for (let i = 0; i < 120 * 10; i++) step(world); // 10 s at 120 Hz

    expect(world.distance).toBeGreaterThan(280);
    expect(world.score).toBe(Math.floor(world.distance * 0.1));
  });

  it('eases the ship toward its target lane and settles on it', () => {
    const world = makeWorld();
    placePlayer(world, 0, 0);
    world.player.targetX = -2;

    step(world);
    expect(world.player.x).toBeLessThan(0);
    expect(world.player.x).toBeGreaterThan(-2);

    for (let i = 0; i < 120; i++) step(world);
    expect(world.player.x).toBeCloseTo(-2, 2);
  });

  it('changes lanes slower during Hyperboost', () => {
    const lateralAfterOneStep = (setup: (world: World) => void) => {
      const world = makeWorld();
      placePlayer(world, 0, 0);
      world.player.targetX = 2;
      setup(world);
      step(world);
      return world.player.x;
    };

    const normal = lateralAfterOneStep(() => {});
    const boosting = lateralAfterOneStep((w) => (w.timers.boostRemaining = 3));

    expect(boosting).toBeGreaterThan(0);
    expect(normal).toBeGreaterThan(boosting);
  });

  it('switches biome sector at the sector boundaries', () => {
    const world = makeWorld();

    placePlayer(world, 0, SECTOR_1_END_Z - 50);
    step(world);
    expect(world.currentSector).toBe(1);

    placePlayer(world, 0, SECTOR_1_END_Z);
    step(world);
    expect(world.currentSector).toBe(2);

    placePlayer(world, 0, SECTOR_2_END_Z);
    step(world);
    expect(world.currentSector).toBe(3);
  });
});
