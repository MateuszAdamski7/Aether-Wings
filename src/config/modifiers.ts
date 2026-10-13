import type { SkinId } from './gameConfig';
import { SPEED_CONFIG, GAMEPLAY_TIMERS } from './tuning';

export interface UpgradesState {
  magnetLevel: number;
  shieldBought: boolean;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  defense_shield_1: boolean;
  defense_shield_2: boolean;
  defense_shield_3: boolean;
  harvest_magnet_1: boolean;
  harvest_magnet_2: boolean;
  harvest_magnet_3: boolean;
  engine_boost_1: boolean;
  engine_boost_2: boolean;
  engine_boost_3: boolean;
}

export interface RunModifiers {
  initialShieldStrength: number;
  hasShieldRegen: boolean;
  shieldRegenCooldown: number;
  hasQuantumRegen: boolean;
  baseMagnetRadius: number;
  magnetPowerupDuration: number;
  boostDuration: number;
  boostSpeedBonus: number;
  boostChargeRate: number;
  crystalMultiplier: number;
}

export const DEFAULT_RUN_MODIFIERS: RunModifiers = {
  initialShieldStrength: 0,
  hasShieldRegen: false,
  shieldRegenCooldown: GAMEPLAY_TIMERS.shieldRegenCooldown,
  hasQuantumRegen: false,
  baseMagnetRadius: 0,
  magnetPowerupDuration: GAMEPLAY_TIMERS.defaultMagnetDuration,
  boostDuration: GAMEPLAY_TIMERS.defaultBoostDuration,
  boostSpeedBonus: SPEED_CONFIG.boostBaseSpeedBonus,
  boostChargeRate: 1.0,
  crystalMultiplier: 1,
};

export function computeRunModifiers(
  upgrades: UpgradesState,
  equippedSkin: SkinId = upgrades.equippedSkin
): RunModifiers {
  // 1. Defense calculations
  let initialShieldStrength = 0;
  if (upgrades.defense_shield_1) {
    initialShieldStrength = upgrades.defense_shield_2 ? 2 : 1;
  }
  // Quantum Vanguard passive: starts with at least 1 shield
  if (equippedSkin === 'quantum') {
    initialShieldStrength = Math.max(initialShieldStrength, 1);
  }

  const hasShieldRegen = Boolean(upgrades.defense_shield_3);
  const hasQuantumRegen = equippedSkin === 'quantum';

  // 2. Harvesting / Magnet calculations
  let baseMagnetRadius = 0;
  if (upgrades.harvest_magnet_3) {
    baseMagnetRadius = 15.0;
  } else if (upgrades.harvest_magnet_2) {
    baseMagnetRadius = 3.0;
  } else if (upgrades.harvest_magnet_1) {
    baseMagnetRadius = 1.5;
  } else if (upgrades.magnetLevel > 0) {
    const legacyRadii = [0, 1.5, 2.5, 4.0];
    baseMagnetRadius = legacyRadii[upgrades.magnetLevel] ?? 0;
  }

  const basePowerupDuration =
    equippedSkin === 'temporal'
      ? GAMEPLAY_TIMERS.temporalSkinMagnetDuration
      : GAMEPLAY_TIMERS.defaultMagnetDuration;
  const extraPowerupDuration = upgrades.harvest_magnet_2
    ? GAMEPLAY_TIMERS.magnetPowerupExtraDuration
    : 0;
  const magnetPowerupDuration = basePowerupDuration + extraPowerupDuration;

  // 3. Engine / Boost calculations
  const boostDuration = upgrades.engine_boost_1
    ? GAMEPLAY_TIMERS.upgradedBoostDuration
    : GAMEPLAY_TIMERS.defaultBoostDuration;
  const boostSpeedBonus = upgrades.engine_boost_3
    ? SPEED_CONFIG.boostWarpSpeedBonus
    : SPEED_CONFIG.boostBaseSpeedBonus;
  const boostChargeRate = upgrades.engine_boost_2 ? 1.2 : 1.0;

  // 4. Multipliers
  const crystalMultiplier = equippedSkin === 'vortex' ? 2 : 1;

  return {
    initialShieldStrength,
    hasShieldRegen,
    shieldRegenCooldown: GAMEPLAY_TIMERS.shieldRegenCooldown,
    hasQuantumRegen,
    baseMagnetRadius,
    magnetPowerupDuration,
    boostDuration,
    boostSpeedBonus,
    boostChargeRate,
    crystalMultiplier,
  };
}
