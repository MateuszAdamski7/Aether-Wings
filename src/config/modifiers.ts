import type { ShipModifier, GameStoreUpgrades } from '../store/types';
import { audioManager } from '../utils/audio';
import { UPGRADE_EFFECTS_CONFIG, UPGRADES } from './upgrades';
import { SKIN_EFFECTS_CONFIG } from './skins';

export const UPGRADE_MODIFIERS: Record<string, ShipModifier[]> = {
  defense_shield_1: [
    {
      id: 'defense_shield_1',
      name: 'Shield Deflector',
      onStartGame: (state, set) => {
        set({ shieldActive: true, shieldStrength: Math.max(state.shieldStrength, UPGRADE_EFFECTS_CONFIG.shield.tier1Capacity) });
      },
      modifyShieldPowerUpCapacity: (capacity) => Math.max(capacity, UPGRADE_EFFECTS_CONFIG.shield.tier1Capacity),
    }
  ],
  defense_shield_2: [
    {
      id: 'defense_shield_2',
      name: 'Shield Fortification',
      onStartGame: (state, set) => {
        set({ shieldActive: true, shieldStrength: Math.max(state.shieldStrength, UPGRADE_EFFECTS_CONFIG.shield.tier2Capacity) });
      },
      modifyShieldPowerUpCapacity: (capacity) => Math.max(capacity, UPGRADE_EFFECTS_CONFIG.shield.tier2Capacity),
    }
  ],
  defense_shield_3: [
    {
      id: 'defense_shield_3',
      name: 'Emergency Nano-Regen',
      onTick: (dt, state, set) => {
        if (!state.shieldActive) {
          const currentTimer = state.shieldRegenTimer ?? 0;
          if (currentTimer <= 0) {
            set({ shieldRegenTimer: UPGRADE_EFFECTS_CONFIG.shield.tier3RegenCooldown });
          } else {
            const nextTimer = Math.max(0, currentTimer - dt);
            if (nextTimer <= 0) {
              set({ shieldActive: true, shieldStrength: 1, shieldRegenTimer: 0 });
              audioManager.playShieldPickupFx();
            } else {
              set({ shieldRegenTimer: nextTimer });
            }
          }
        } else {
          if (state.shieldRegenTimer !== 0) {
            set({ shieldRegenTimer: 0 });
          }
        }
      }
    }
  ],
  harvest_magnet_1: [
    {
      id: 'harvest_magnet_1',
      name: 'Crystal Magnet',
      modifyMagnetRadius: (radius, isPowerUpActive) => 
        isPowerUpActive ? radius : Math.max(radius, UPGRADE_EFFECTS_CONFIG.magnet.tier1Radius),
    }
  ],
  harvest_magnet_2: [
    {
      id: 'harvest_magnet_2',
      name: 'Magnet Amplification',
      modifyMagnetRadius: (radius, isPowerUpActive) => 
        isPowerUpActive ? radius : Math.max(radius, UPGRADE_EFFECTS_CONFIG.magnet.tier2Radius),
      modifyMagnetPowerUpDuration: (duration) => 
        duration + UPGRADE_EFFECTS_CONFIG.magnet.tier2ExtraDuration,
    }
  ],
  harvest_magnet_3: [
    {
      id: 'harvest_magnet_3',
      name: 'Singularity Attractor',
      modifyMagnetRadius: (radius, isPowerUpActive) => 
        isPowerUpActive ? radius : Math.max(radius, UPGRADE_EFFECTS_CONFIG.magnet.tier3Radius),
    }
  ],
  engine_boost_1: [
    {
      id: 'engine_boost_1',
      name: 'Boost Overcharger',
      modifyBoostDuration: (duration) => 
        Math.max(duration, UPGRADE_EFFECTS_CONFIG.engine.tier1BoostDuration),
    }
  ],
  engine_boost_2: [
    {
      id: 'engine_boost_2',
      name: 'Fuel Recovery Matrix',
      modifyBoostChargeRate: (rate) => 
        rate * UPGRADE_EFFECTS_CONFIG.engine.tier2ChargeRateMultiplier,
    }
  ],
  engine_boost_3: [
    {
      id: 'engine_boost_3',
      name: 'Time Dilator',
      modifySlowMoPowerUpDuration: (duration) => 
        duration + UPGRADE_EFFECTS_CONFIG.engine.tier3ExtraSlowMoDuration,
      modifyExtraBoostSpeed: (speed) => 
        Math.max(speed, UPGRADE_EFFECTS_CONFIG.engine.tier3ExtraBoostSpeed),
    }
  ]
};

export const SKIN_MODIFIERS: Record<string, ShipModifier[]> = {
  vortex: [
    {
      id: 'skin_vortex',
      name: 'Vortex Singularity Passive',
      modifyCrystalMultiplier: (multiplier) => 
        multiplier * SKIN_EFFECTS_CONFIG.vortex.crystalMultiplier,
    }
  ],
  quantum: [
    {
      id: 'skin_quantum',
      name: 'Quantum Vanguard Passive',
      onStartGame: (state, set) => {
        set({ shieldActive: true, shieldStrength: Math.max(state.shieldStrength, 1) });
      },
      onTick: (_dt, state, set) => {
        if (!state.shieldActive && state.playerZ >= SKIN_EFFECTS_CONFIG.quantum.shieldRegenMinZ && !state.quantumShieldRegenerated) {
          set({
            shieldActive: true,
            shieldStrength: Math.max(state.shieldStrength, 1),
            quantumShieldRegenerated: true
          });
          audioManager.playShieldPickupFx();
        }
      }
    }
  ],
  temporal: [
    {
      id: 'skin_temporal',
      name: 'Temporal Warp Wing Passive',
      modifySlowMoFactor: () => SKIN_EFFECTS_CONFIG.temporal.slowMoFactor,
      modifySlowMoPowerUpDuration: (duration) => 
        // Temporal has a default 8s powerup base duration instead of 5s
        duration + (SKIN_EFFECTS_CONFIG.temporal.powerUpBaseDuration - SKIN_EFFECTS_CONFIG.default.powerUpBaseDuration)
    }
  ]
};

// Rebuild function to compile the list of modifiers based on bought upgrades & equipped skin
export const rebuildActiveModifiers = (upgrades: GameStoreUpgrades): ShipModifier[] => {
  const active: ShipModifier[] = [];

  // 1. Process bought upgrades
  Object.keys(UPGRADE_MODIFIERS).forEach((key) => {
    const upgrade = UPGRADES.find((n) => n.id === key);

    const isBought = upgrades[key as keyof GameStoreUpgrades];
    const isEnabled = upgrade ? upgrade.enabled : true;
    
    if (isBought && isEnabled) {
      active.push(...UPGRADE_MODIFIERS[key]);
    }
  });

  // 2. Process equipped skin modifiers
  const skin = upgrades.equippedSkin;
  if (skin && SKIN_MODIFIERS[skin]) {
    active.push(...SKIN_MODIFIERS[skin]);
  }

  return active;
};
