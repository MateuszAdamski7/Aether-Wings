
export interface UpgradeNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  branch: 'DEFENSE' | 'HARVESTING' | 'ENGINE';
  tier: number;
  prerequisite: string | null;
  icon: string;
  effectLabel: string;
  enabled: boolean;
}

export const UPGRADES: UpgradeNode[] = [
  // Branch 1: Defense
  {
    id: 'defense_shield_1',
    name: 'Shield Deflector',
    description: 'Deploys an energy barrier that absorbs one collision. Starts charged on every run.',
    cost: 25,
    branch: 'DEFENSE',
    tier: 1,
    prerequisite: null,
    icon: 'Shield',
    effectLabel: 'Shield capacity: 1 hit',
    enabled: true
  },
  {
    id: 'defense_shield_2',
    name: 'Shield Fortification',
    description: 'Increases deflector capacity. The shield can absorb up to 2 collisions before shattering.',
    cost: 55,
    branch: 'DEFENSE',
    tier: 2,
    prerequisite: 'defense_shield_1',
    icon: 'Layers',
    effectLabel: 'Shield capacity: 2 hits',
    enabled: true
  },
  {
    id: 'defense_shield_3',
    name: 'Emergency Nano-Regen',
    description: 'When the shield is fully depleted, it will automatically regenerate back to 1 charge after 40 seconds of clean flight.',
    cost: 95,
    branch: 'DEFENSE',
    tier: 3,
    prerequisite: 'defense_shield_2',
    icon: 'ShieldAlert',
    effectLabel: 'Auto-regenerates shield (40s CD)',
    enabled: true
  },
  // Branch 2: Harvesting
  {
    id: 'harvest_magnet_1',
    name: 'Crystal Magnet',
    description: 'Creates a magnetic field pulling road crystals towards your ship (Radius: 1.5m).',
    cost: 20,
    branch: 'HARVESTING',
    tier: 1,
    prerequisite: null,
    icon: 'Magnet',
    effectLabel: 'Magnet Range: 1.5m',
    enabled: true
  },
  {
    id: 'harvest_magnet_2',
    name: 'Magnet Amplification',
    description: 'Enhances magnetic pull range to 3.0m and increases the duration of picked-up Magnet power-ups by 3 seconds.',
    cost: 50,
    branch: 'HARVESTING',
    tier: 2,
    prerequisite: 'harvest_magnet_1',
    icon: 'Sparkles',
    effectLabel: 'Magnet Range: 3.0m / Power-up +3s',
    enabled: true
  },
  {
    id: 'harvest_magnet_3',
    name: 'Singularity Attractor',
    description: 'Unlocks ultimate magnet range (15.0m), drawing all road crystals from all lanes instantly.',
    cost: 90,
    branch: 'HARVESTING',
    tier: 3,
    prerequisite: 'harvest_magnet_2',
    icon: 'Coins',
    effectLabel: 'Draws crystals from all lanes',
    enabled: true
  },
  // Branch 3: Performance
  {
    id: 'engine_boost_1',
    name: 'Boost Overcharger',
    description: 'Upgrades the Hyperboost duration. Hyperboost lasts 1 second longer (6 seconds total).',
    cost: 30,
    branch: 'ENGINE',
    tier: 1,
    prerequisite: null,
    icon: 'Gauge',
    effectLabel: 'Hyperboost Duration: 6.0s',
    enabled: true
  },
  {
    id: 'engine_boost_2',
    name: 'Fuel Recovery Matrix',
    description: 'Optimizes fuel converter. Crystals collected during standard runs charge the Hyperboost gauge 20% faster.',
    cost: 60,
    branch: 'ENGINE',
    tier: 2,
    prerequisite: 'engine_boost_1',
    icon: 'Zap',
    effectLabel: 'Boost Charge Rate +20%',
    enabled: true
  },
  {
    id: 'engine_boost_3',
    name: 'Time Dilator',
    description: 'Increases Slow-Mo active time by 2.0s, and boosts ship velocity by an additional 10 units/s during Hyperboost.',
    cost: 100,
    branch: 'ENGINE',
    tier: 3,
    prerequisite: 'engine_boost_2',
    icon: 'Hourglass',
    effectLabel: 'Slowmo +2s / Hyperboost Speed +10',
    enabled: true
  }
];


export const UPGRADE_EFFECTS_CONFIG = {
  magnet: {
    baseRadius: 0.0,
    powerUpRadius: 6.0,
    tier1Radius: 1.5,
    tier2Radius: 3.0,
    tier3Radius: 15.0,
    legacyRadii: [0, 1.5, 2.5, 4.0],
    powerUpBaseDuration: 8.0,
    tier2ExtraDuration: 3.0,
  },
  shield: {
    tier1Capacity: 1,
    tier2Capacity: 2,
    tier3RegenCooldown: 40.0, // seconds
    powerUpBaseCapacity: 1,
  },
  engine: {
    baseBoostDuration: 4.0, // default BOOST_DURATION
    tier1BoostDuration: 6.0,
    tier2ChargeRateMultiplier: 1.2,
    baseChargeRate: 1.0,
    tier3ExtraSlowMoDuration: 2.0,
    baseExtraBoostSpeed: 25,
    tier3ExtraBoostSpeed: 35,
  },
};


