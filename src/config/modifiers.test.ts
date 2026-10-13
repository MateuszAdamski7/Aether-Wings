import { describe, expect, it } from 'vitest';
import { computeRunModifiers, DEFAULT_RUN_MODIFIERS, type UpgradesState } from './modifiers';
import { GAMEPLAY_TIMERS, SPEED_CONFIG } from './tuning';
import type { SkinId } from './gameConfig';

const NO_UPGRADES: UpgradesState = {
  magnetLevel: 0,
  shieldBought: false,
  unlockedSkins: ['vortex'],
  equippedSkin: 'vortex',
  defense_shield_1: false,
  defense_shield_2: false,
  defense_shield_3: false,
  harvest_magnet_1: false,
  harvest_magnet_2: false,
  harvest_magnet_3: false,
  engine_boost_1: false,
  engine_boost_2: false,
  engine_boost_3: false,
};

const modifiersFor = (upgrades: Partial<UpgradesState>, skin: SkinId = 'vortex') =>
  computeRunModifiers({ ...NO_UPGRADES, ...upgrades }, skin);

describe('computeRunModifiers', () => {
  it('starts a fresh pilot with no shield or magnet', () => {
    const modifiers = modifiersFor({}, 'temporal');

    expect(modifiers.initialShieldStrength).toBe(0);
    expect(modifiers.baseMagnetRadius).toBe(0);
    expect(modifiers.boostDuration).toBe(DEFAULT_RUN_MODIFIERS.boostDuration);
  });

  it('grows the starting shield with each defense tier', () => {
    expect(modifiersFor({ defense_shield_1: true }, 'temporal').initialShieldStrength).toBe(1);
    expect(modifiersFor({ defense_shield_1: true, defense_shield_2: true }, 'temporal').initialShieldStrength).toBe(2);
    expect(modifiersFor({ defense_shield_3: true }).hasShieldRegen).toBe(true);
  });

  it('extends magnet radius per harvesting tier', () => {
    expect(modifiersFor({ harvest_magnet_1: true }).baseMagnetRadius).toBe(1.5);
    expect(modifiersFor({ harvest_magnet_1: true, harvest_magnet_2: true }).baseMagnetRadius).toBe(3);
    expect(modifiersFor({ harvest_magnet_3: true }).baseMagnetRadius).toBe(15);
  });

  it('applies engine upgrades to Hyperboost', () => {
    const modifiers = modifiersFor({ engine_boost_1: true, engine_boost_2: true, engine_boost_3: true });

    expect(modifiers.boostDuration).toBe(GAMEPLAY_TIMERS.upgradedBoostDuration);
    expect(modifiers.boostChargeRate).toBe(1.2);
    expect(modifiers.boostSpeedBonus).toBe(SPEED_CONFIG.boostWarpSpeedBonus);
  });

  it('applies each ship skin passive', () => {
    expect(modifiersFor({}, 'vortex').crystalMultiplier).toBe(2);
    expect(modifiersFor({}, 'quantum')).toMatchObject({ initialShieldStrength: 1, hasQuantumRegen: true, crystalMultiplier: 1 });
    expect(modifiersFor({ harvest_magnet_2: true }, 'temporal').magnetPowerupDuration).toBe(
      GAMEPLAY_TIMERS.temporalSkinMagnetDuration + GAMEPLAY_TIMERS.magnetPowerupExtraDuration
    );
  });

  it('keeps the bigger shield when the quantum skin and defense upgrades overlap', () => {
    expect(modifiersFor({ defense_shield_1: true, defense_shield_2: true }, 'quantum').initialShieldStrength).toBe(2);
  });
});
