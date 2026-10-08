import { describe, expect, it } from 'vitest';
import { collisionSystem } from './collisionSystem';
import { makeWorld, obstacle, placePlayer, recordingBus } from '../testing';

describe('collisionSystem', () => {
  it('crashes when an obstacle in the same lane is reached', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.obstacles = [obstacle({ x: 0, z: 11 })];
    const { bus, events } = recordingBus();

    collisionSystem(world, bus);

    expect(world.collisionTriggered).toBe(true);
    expect(events.map((e) => e.type)).toEqual(['crash']);
  });

  it('ignores obstacles in a neighbouring lane', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.obstacles = [obstacle({ x: 2, z: 10 })];
    const { bus, events } = recordingBus();

    collisionSystem(world, bus);

    expect(world.collisionTriggered).toBe(false);
    expect(events).toHaveLength(0);
  });

  it('catches obstacles passed between steps (no tunnelling at high speed)', () => {
    const world = makeWorld();
    placePlayer(world, 0, 20);
    world.player.prevZ = 0; // the ship covered 20 units in one step
    world.obstacles = [obstacle({ x: 0, z: 10 })];
    const { bus } = recordingBus();

    collisionSystem(world, bus);

    expect(world.collisionTriggered).toBe(true);
  });

  it('lets an active shield absorb the hit and destroy the obstacle', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.shield.active = true;
    world.shield.strength = 2;
    world.obstacles = [obstacle({ x: 0, z: 10 })];
    const { bus, events } = recordingBus();

    collisionSystem(world, bus);

    expect(world.collisionTriggered).toBe(false);
    expect(world.shield).toMatchObject({ active: true, strength: 1 });
    expect(world.obstacles).toHaveLength(0);
    expect(world.runStats.obstaclesCrushed).toBe(1);
    expect(world.score).toBe(1000);
    expect(events).toEqual([{ type: 'shieldAbsorbed', data: { remainingStrength: 1 } }]);
  });

  it('turns the shield off when its last charge is used', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.shield.active = true;
    world.shield.strength = 1;
    world.obstacles = [obstacle({ x: 0, z: 10 })];

    collisionSystem(world, recordingBus().bus);

    expect(world.shield).toMatchObject({ active: false, strength: 0 });
  });

  it('smashes through obstacles during Hyperboost without using the shield', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.timers.boostRemaining = 2;
    world.shield.active = true;
    world.shield.strength = 2;
    world.obstacles = [obstacle({ x: 0, z: 10 }), obstacle({ x: 0, z: 60 })];

    collisionSystem(world, recordingBus().bus);

    expect(world.collisionTriggered).toBe(false);
    expect(world.shield.strength).toBe(2);
    expect(world.obstacles.map((o) => o.z)).toEqual([60]);
    expect(world.runStats.obstaclesCrushed).toBe(1);
  });
});
