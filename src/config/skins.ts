import { PALETTE } from './colors';

export interface Skin {
  id: string;
  name: string;
  color: string;
  cost: number;
  description: string;
}

export const SKINS: Skin[] = [
  { id: 'pink', name: 'Laser Pink', color: PALETTE.neonPink, cost: 0, description: '' },
  { id: 'cyan', name: 'Cyan Flare', color: PALETTE.neonCyan, cost: 40, description: '' },
  { id: 'yellow', name: 'Solar Yellow', color: PALETTE.neonYellow, cost: 40, description: '' },
  { id: 'green', name: 'Acid Green', color: PALETTE.neonGreen, cost: 40, description: '' },
  { id: 'purple', name: 'Nebula Violet', color: PALETTE.voidPurple, cost: 40, description: '' },
  { id: 'vortex', name: 'Vortex Singularity', color: PALETTE.neonCyan, cost: 150, description: 'Passive: 2x Crystals & Boost charge' },
  { id: 'quantum', name: 'Quantum Vanguard', color: PALETTE.quantumCyan, cost: 150, description: 'Passive: Start shield & auto-regen' },
  { id: 'temporal', name: 'Temporal Warp Wing', color: PALETTE.neonYellow, cost: 150, description: 'Passive: 0.45x Slow-Mo & 8s powerups' }
];

export const SKIN_EFFECTS_CONFIG = {
  vortex: {
    crystalMultiplier: 2,
  },
  quantum: {
    shieldRegenMinZ: 1500,
  },
  temporal: {
    slowMoFactor: 0.45,
    powerUpBaseDuration: 8.0,
  },
  default: {
    crystalMultiplier: 1,
    slowMoFactor: 0.65,
    powerUpBaseDuration: 5.0,
  }
};
