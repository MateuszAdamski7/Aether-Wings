// Sector layout and logic shared by the simulation and rendering. Keep three.js out of this file:
// the game logic imports it, and three must stay in the lazily loaded 3D chunk.

// 1. Sector Boundaries & Transition Tuning
export const SECTOR_1_END_Z = 1200;
export const SECTOR_2_END_Z = 2800;

export const S1_TRANSITION_START = 1000;
export const S1_TRANSITION_END = 1300;
export const S2_TRANSITION_START = 2600;
export const S2_TRANSITION_END = 2900;
export const TRANSITION_DISTANCE = 300;

export function getSectorIndex(z: number): 1 | 2 | 3 {
  if (z >= SECTOR_2_END_Z) return 3;
  if (z >= SECTOR_1_END_Z) return 2;
  return 1;
}

// 2. Hazard obstacle colors (Hex strings for materials)
export const HAZARD_COLORS = {
  s1: '#ff0055', // Sector 1: Magenta/Pink
  s2: '#ffaa00', // Sector 2: Neon Yellow/Orange
  s3: '#9d00ff', // Sector 3: Void Purple
} as const;

export function getHazardColor(z: number): string {
  if (z >= SECTOR_2_END_Z) return HAZARD_COLORS.s3;
  if (z >= SECTOR_1_END_Z) return HAZARD_COLORS.s2;
  return HAZARD_COLORS.s1;
}
