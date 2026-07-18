import { audioManager } from '../utils/audio';
import { PALETTE } from './colors';

export interface PowerUpConfig {
  type: string;
  name: string;
  baseDuration: number; // Infinity for SHIELD (it uses durability strength instead)
  color: string;
  glowColorClass: string;
  bgClass: string;
  textColor: string;
  pickupAudio: () => void;
}

export const POWER_UP_REGISTRY: Record<string, PowerUpConfig> = {
  SHIELD: {
    type: 'SHIELD',
    name: 'Shield Barrier',
    baseDuration: Infinity,
    color: PALETTE.neonCyan,
    glowColorClass: 'border-glow-cyan',
    bgClass: 'bg-cyan-950/20',
    textColor: '#00f3ff',
    pickupAudio: () => audioManager.playShieldPickupFx(),
  },
  MAGNET: {
    type: 'MAGNET',
    name: 'Magnet Sweep',
    baseDuration: 8.0,
    color: PALETTE.hotPink,
    glowColorClass: 'border-glow-magenta',
    bgClass: 'bg-pink-950/20',
    textColor: '#ff007f',
    pickupAudio: () => audioManager.playMagnetPickupFx(),
  },
};
