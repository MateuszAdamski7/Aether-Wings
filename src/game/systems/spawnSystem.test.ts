import { describe, expect, it } from 'vitest';
import { spawnSystem } from './spawnSystem';
import { createWorld } from '../world';
import { crystal, obstacle, placePlayer } from '../testing';
import { DEFAULT_RUN_MODIFIERS } from '../../config/modifiers';
import { SECTOR_1_END_Z } from '../../config/sectors';
import type { Obstacle } from '../../store/types';

const spawningWorld = (seed: number) => createWorld(DEFAULT_RUN_MODIFIERS, [], seed);

describe('spawnSystem', () => {
  it('generates the same track for the same seed', () => {
    const a = spawningWorld(42);
    const b = spawningWorld(42);

    spawnSystem(a);
    spawnSystem(b);

    expect(a.obstacles.length).toBeGreaterThan(0);
    expect(a.obstacles).toEqual(b.obstacles);
    expect(a.crystals).toEqual(b.crystals);
    expect(a.powerUps).toEqual(b.powerUps);
  });

  it('leaves the start of the run clear of obstacles', () => {
    const world = spawningWorld(7);

    spawnSystem(world);

    expect(Math.min(...world.obstacles.map((o) => o.z))).toBeGreaterThanOrEqual(150);
  });

  it.each([1, 2, 3, 4, 5])('always leaves at least one lane open (seed %i)', (seed) => {
    const world = spawningWorld(seed);
    const seen = new Map<string, Obstacle>();

    // Fly through sector 1 (static obstacles), recording everything before it is cleaned up
    for (let z = 0; z < SECTOR_1_END_Z - 200; z += 35) {
      placePlayer(world, 0, z);
      spawnSystem(world);
      for (const o of world.obstacles) seen.set(o.id, { ...o });
    }

    const lanesBlockedPerRow = new Map<number, Set<number>>();
    for (const o of seen.values()) {
      const lanes = lanesBlockedPerRow.get(o.z) ?? new Set<number>();
      lanes.add(o.x);
      lanesBlockedPerRow.set(o.z, lanes);
    }
    expect(lanesBlockedPerRow.size).toBeGreaterThan(10);
    for (const lanes of lanesBlockedPerRow.values()) {
      expect(lanes.size).toBeLessThan(3);
    }
  });

  it('removes track objects that fell more than 15 units behind the ship', () => {
    const world = spawningWorld(1);
    world.lastSpawnedZ = Number.POSITIVE_INFINITY;
    placePlayer(world, 0, 100);
    world.obstacles = [obstacle({ z: 80 }), obstacle({ z: 90 })];
    world.crystals = [crystal({ z: 70 }), crystal({ z: 120 })];

    spawnSystem(world);

    expect(world.obstacles.map((o) => o.z)).toEqual([90]);
    expect(world.crystals.map((c) => c.z)).toEqual([120]);
  });
});
