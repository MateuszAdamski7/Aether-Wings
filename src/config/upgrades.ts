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
}

export const UPGRADE_NODES: UpgradeNode[] = [
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
    effectLabel: 'Shield capacity: 1 hit'
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
    effectLabel: 'Shield capacity: 2 hits'
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
    effectLabel: 'Auto-regenerates shield (40s CD)'
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
    effectLabel: 'Magnet Range: 1.5m'
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
    effectLabel: 'Magnet Range: 3.0m / Power-up +3s'
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
    effectLabel: 'Draws crystals from all lanes'
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
    effectLabel: 'Hyperboost Duration: 6.0s'
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
    effectLabel: 'Boost Charge Rate +20%'
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
    effectLabel: 'Slowmo +2s / Hyperboost Speed +10'
  }
];

export const NODE_COSTS: Record<string, number> = {
  defense_shield_1: 25,
  defense_shield_2: 55,
  defense_shield_3: 95,
  harvest_magnet_1: 20,
  harvest_magnet_2: 50,
  harvest_magnet_3: 90,
  engine_boost_1: 30,
  engine_boost_2: 60,
  engine_boost_3: 100,
};

export const PREREQUISITES: Record<string, string | null> = {
  defense_shield_1: null,
  defense_shield_2: 'defense_shield_1',
  defense_shield_3: 'defense_shield_2',
  harvest_magnet_1: null,
  harvest_magnet_2: 'harvest_magnet_1',
  harvest_magnet_3: 'harvest_magnet_2',
  engine_boost_1: null,
  engine_boost_2: 'engine_boost_1',
  engine_boost_3: 'engine_boost_2',
};
