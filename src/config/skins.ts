export interface Skin {
  id: string;
  name: string;
  color: string;
  cost: number;
  description: string;
}

export const SKINS: Skin[] = [
  { id: 'pink', name: 'Laser Pink', color: '#ff0055', cost: 0, description: '' },
  { id: 'cyan', name: 'Cyan Flare', color: '#00f3ff', cost: 40, description: '' },
  { id: 'yellow', name: 'Solar Yellow', color: '#ffe600', cost: 40, description: '' },
  { id: 'green', name: 'Acid Green', color: '#39ff14', cost: 40, description: '' },
  { id: 'purple', name: 'Nebula Violet', color: '#9d00ff', cost: 40, description: '' },
  { id: 'vortex', name: 'Vortex Singularity', color: '#00f3ff', cost: 150, description: 'Passive: 2x Crystals & Boost charge' },
  { id: 'quantum', name: 'Quantum Vanguard', color: '#00ffff', cost: 150, description: 'Passive: Start shield & auto-regen' },
  { id: 'temporal', name: 'Temporal Warp Wing', color: '#ffe600', cost: 150, description: 'Passive: 0.45x Slow-Mo & 8s powerups' }
];
