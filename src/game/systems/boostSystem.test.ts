import { describe, expect, it } from 'vitest';
import { boostSystem } from './boostSystem';
import { FIXED_STEP } from '../loop';
import { makeWorld, obstacle, placePlayer, recordingBus } from '../testing';
import { GAMEPLAY_TIMERS } from '../../config/tuning';

describe('boostSystem', () => {
  it('accelerates toward boost speed and keeps the ship in the centre lane', () => {
    const world = makeWorld();
    world.player.speed = 30;
    world.player.preBoostSpeed = 30;
    world.player.targetX = 2;
    world.timers.boostRemaining = 3;

    boostSystem(world, FIXED_STEP, recordingBus().bus);

    expect(world.player.speed).toBeGreaterThan(30);
    expect(world.player.targetX).toBe(0);
  });

  it('ends with a sonic blast that clears obstacles just ahead and restores speed', () => {
    const world = makeWorld();
    placePlayer(world, 0, 100);
    world.player.speed = 55;
    world.player.preBoostSpeed = 30;
    world.timers.boostRemaining = FIXED_STEP / 2;
    world.timers.boostCharge = 10;
    world.obstacles = [
      obstacle({ z: 95 }), // behind the ship
      obstacle({ z: 110 }), // inside blast range
      obstacle({ z: 100 + GAMEPLAY_TIMERS.sonicBlastRangeZ + 20 }), // beyond blast range
    ];
    const { bus, events } = recordingBus();

    boostSystem(world, FIXED_STEP, bus);

    expect(world.obstacles.map((o) => o.z)).toEqual([95, 200]);
    expect(world.player.speed).toBe(30);
    expect(world.timers.boostRemaining).toBe(0);
    expect(world.timers.boostCharge).toBe(0);
    expect(world.timers.blastActive).toBeGreaterThan(0);
    expect(events.map((e) => e.type)).toEqual(['blastFired', 'boostEnded']);
  });

  it('does nothing while no boost is running', () => {
    const world = makeWorld();
    world.player.speed = 30;
    world.player.targetX = 2;
    const { bus, events } = recordingBus();

    boostSystem(world, FIXED_STEP, bus);

    expect(world.player.speed).toBe(30);
    expect(world.player.targetX).toBe(2);
    expect(events).toHaveLength(0);
  });
});
