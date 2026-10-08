import { describe, expect, it } from 'vitest';
import { crystalSystem } from './crystalSystem';
import { FIXED_STEP } from '../loop';
import { crystal, makeWorld, placePlayer, recordingBus } from '../testing';

describe('crystalSystem', () => {
  it('collects a crystal the ship flies through', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.crystals = [crystal({ x: 0, z: 10.5, color: '#ff007f' })];
    const { bus, events } = recordingBus();

    crystalSystem(world, FIXED_STEP, bus);

    expect(world.crystals[0].collected).toBe(true);
    expect(world.crystalCount).toBe(1);
    expect(world.runStats.crystalsCollected).toBe(1);
    expect(world.score).toBe(500);
    expect(world.timers.boostCharge).toBe(1);
    expect(events).toEqual([{ type: 'crystalCollected', data: { count: 1, earned: 1, color: '#ff007f' } }]);
  });

  it('applies the crystal multiplier and boost charge rate from upgrades', () => {
    const world = makeWorld({ crystalMultiplier: 2, boostChargeRate: 1.2 });
    placePlayer(world, 0, 10);
    world.crystals = [crystal({ x: 0, z: 10 })];

    crystalSystem(world, FIXED_STEP, recordingBus().bus);

    expect(world.crystalCount).toBe(2);
    expect(world.score).toBe(1000);
    expect(world.timers.boostCharge).toBeCloseTo(2.4);
  });

  it('does not collect crystals in another lane without a magnet', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.crystals = [crystal({ x: 2, z: 10 })];
    const { bus, events } = recordingBus();

    crystalSystem(world, FIXED_STEP, bus);

    expect(world.crystals[0].collected).toBe(false);
    expect(events).toHaveLength(0);
  });

  it('pulls nearby crystals in from other lanes while a magnet power-up is active', () => {
    const collectedWithin = (magnetSeconds: number) => {
      const world = makeWorld();
      placePlayer(world, 0, 10);
      world.timers.magnetActive = magnetSeconds;
      world.crystals = [crystal({ x: 2, z: 13 })];
      for (let i = 0; i < 60; i++) crystalSystem(world, FIXED_STEP, recordingBus().bus);
      return world.crystals[0].collected;
    };

    expect(collectedWithin(5)).toBe(true);
    expect(collectedWithin(0)).toBe(false);
  });

  it.each([28, 50, 70, 90])('magnet pulls a crystal in from two lanes away at speed %i', (speed) => {
    const world = makeWorld();
    placePlayer(world, -2, 0);
    world.player.speed = speed;
    world.timers.magnetActive = 5;
    world.crystals = [crystal({ x: 2, z: 30 })];

    let collectedAtZ: number | null = null;
    for (let i = 0; i < 120 && collectedAtZ === null; i++) {
      world.player.prevZ = world.player.z;
      world.player.z += speed * FIXED_STEP;
      crystalSystem(world, FIXED_STEP, recordingBus().bus);
      if (world.crystals[0].collected) collectedAtZ = world.player.z;
    }

    expect(collectedAtZ).not.toBeNull();
  });

  it('caps Hyperboost charge at 10', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.timers.boostCharge = 9.5;
    world.crystals = [crystal({ x: 0, z: 10 })];

    crystalSystem(world, FIXED_STEP, recordingBus().bus);

    expect(world.timers.boostCharge).toBe(10);
  });

  it('does not charge Hyperboost while it is already running', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.timers.boostRemaining = 2;
    world.timers.boostCharge = 10;
    world.crystals = [crystal({ x: 0, z: 10 })];

    crystalSystem(world, FIXED_STEP, recordingBus().bus);

    expect(world.crystalCount).toBe(1);
    expect(world.timers.boostCharge).toBe(10);
  });

  it('never counts the same crystal twice', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.crystals = [crystal({ x: 0, z: 10 })];
    const { bus, events } = recordingBus();

    crystalSystem(world, FIXED_STEP, bus);
    crystalSystem(world, FIXED_STEP, bus);

    expect(world.crystalCount).toBe(1);
    expect(events).toHaveLength(1);
  });
});
