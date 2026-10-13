import { describe, expect, it } from 'vitest';
import { powerupSystem } from './powerupSystem';
import { FIXED_STEP } from '../loop';
import { makeWorld, placePlayer, powerUp, recordingBus } from '../testing';
import { DEFAULT_RUN_MODIFIERS } from '../../config/modifiers';

describe('powerupSystem', () => {
  it('raises a one-hit shield when a shield power-up is picked up', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.powerUps = [powerUp({ type: 'SHIELD', x: 0, z: 10 })];
    const { bus, events } = recordingBus();

    powerupSystem(world, FIXED_STEP, bus);

    expect(world.powerUps[0].collected).toBe(true);
    expect(world.shield).toMatchObject({ active: true, strength: 1 });
    expect(events).toEqual([{ type: 'powerupCollected', data: { type: 'SHIELD' } }]);
  });

  it('gives a two-hit shield with the Shield Fortification upgrade', () => {
    const world = makeWorld({ initialShieldStrength: 2 });
    placePlayer(world, 0, 10);
    world.shield.active = false;
    world.powerUps = [powerUp({ type: 'SHIELD', x: 0, z: 10 })];

    powerupSystem(world, FIXED_STEP, recordingBus().bus);

    expect(world.shield.strength).toBe(2);
  });

  it('starts the magnet timer on a magnet pickup and runs it down over time', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.powerUps = [powerUp({ type: 'MAGNET', x: 0, z: 10 })];

    powerupSystem(world, FIXED_STEP, recordingBus().bus);
    expect(world.timers.magnetActive).toBe(DEFAULT_RUN_MODIFIERS.magnetPowerupDuration);

    powerupSystem(world, 0.5, recordingBus().bus);
    expect(world.timers.magnetActive).toBeCloseTo(DEFAULT_RUN_MODIFIERS.magnetPowerupDuration - 0.5);
  });

  it('ignores power-ups in another lane', () => {
    const world = makeWorld();
    placePlayer(world, 0, 10);
    world.powerUps = [powerUp({ type: 'SHIELD', x: 2, z: 10 })];

    powerupSystem(world, FIXED_STEP, recordingBus().bus);

    expect(world.powerUps[0].collected).toBe(false);
    expect(world.shield.active).toBe(false);
  });

  it('regenerates a depleted shield after the cooldown with Emergency Nano-Regen', () => {
    const world = makeWorld({ hasShieldRegen: true, shieldRegenCooldown: 2 });
    const { bus, events } = recordingBus();

    for (let i = 0; i < 15; i++) powerupSystem(world, 0.1, bus);
    expect(world.shield.active).toBe(false);

    for (let i = 0; i < 10; i++) powerupSystem(world, 0.1, bus);
    expect(world.shield).toMatchObject({ active: true, strength: 1 });
    expect(events.map((e) => e.type)).toEqual(['shieldRegenerated']);
  });

  it('does not regenerate the shield without the upgrade', () => {
    const world = makeWorld({ hasShieldRegen: false });

    for (let i = 0; i < 100; i++) powerupSystem(world, 0.1, recordingBus().bus);

    expect(world.shield.active).toBe(false);
  });

  it('restores the Quantum Vanguard shield once after 1500 units', () => {
    const world = makeWorld({ hasQuantumRegen: true });
    placePlayer(world, 0, 1600);

    powerupSystem(world, FIXED_STEP, recordingBus().bus);
    expect(world.shield.active).toBe(true);

    world.shield.active = false;
    world.shield.strength = 0;
    powerupSystem(world, FIXED_STEP, recordingBus().bus);
    expect(world.shield.active).toBe(false);
  });
});
