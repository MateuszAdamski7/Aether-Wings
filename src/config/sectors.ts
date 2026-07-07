import { PALETTE } from './colors';


//todo: guide on adding new sectors
export interface SectorConfig {
  id: number;
  name: string;
  startZ: number;
  geometryType: 'PYRAMID' | 'TOWER';
  hasSlidingObstacles: boolean;
  hasPulsingObstacles: boolean;
  colors: {
    hazard: string;
    accent: string;
    skyBottom: string;
    skyTop: string;
    fog: string;
    star1: string;
    star2: string;
    mountainLeft: string;
    mountainRight: string;
    trackTheme: string;
    trackRailLeft: string;
    trackRailRight: string;
  };
}

export const SECTORS: SectorConfig[] = [
  {
    id: 1,
    name: 'Neon Grid',
    startZ: 0,
    geometryType: 'PYRAMID',
    hasSlidingObstacles: false,
    hasPulsingObstacles: false,
    colors: {
      hazard: PALETTE.neonPink,
      accent: PALETTE.neonYellow,
      skyBottom: PALETTE.orange,
      skyTop: PALETTE.skyPink,
      fog: PALETTE.deepSpaceBg,
      star1: PALETTE.neonCyan,
      star2: PALETTE.hotPink,
      mountainLeft: PALETTE.neonCyan,
      mountainRight: PALETTE.hotPink,
      trackTheme: PALETTE.voidPurple,
      trackRailLeft: PALETTE.neonCyan,
      trackRailRight: PALETTE.hotPink
    }
  },
  {
    id: 2,
    name: 'Golden Metropolis',
    startZ: 1200,
    geometryType: 'TOWER',
    hasSlidingObstacles: true,
    hasPulsingObstacles: false,
    colors: {
      hazard: PALETTE.s2Hazard,
      accent: PALETTE.neonGreen,
      skyBottom: PALETTE.deepOrange,
      skyTop: PALETTE.neonYellow,
      fog: PALETTE.darkGreenBg,
      star1: PALETTE.neonGreen,
      star2: PALETTE.neonYellow,
      mountainLeft: PALETTE.neonGreen,
      mountainRight: PALETTE.neonYellow,
      trackTheme: PALETTE.deepOrange,
      trackRailLeft: PALETTE.neonGreen,
      trackRailRight: PALETTE.neonYellow
    }
  },
  {
    id: 3,
    name: 'Void Horizon',
    startZ: 2800,
    geometryType: 'TOWER',
    hasSlidingObstacles: true,
    hasPulsingObstacles: true,
    colors: {
      hazard: PALETTE.voidPurple,
      accent: PALETTE.neonYellow,
      skyBottom: PALETTE.indigo,
      skyTop: PALETTE.s3SkyTop,
      fog: PALETTE.darkPurpleBg,
      star1: PALETTE.crimsonRed,
      star2: PALETTE.indigo,
      mountainLeft: PALETTE.crimsonRed,
      mountainRight: PALETTE.voidPurple,
      trackTheme: PALETTE.indigo,
      trackRailLeft: PALETTE.crimsonRed,
      trackRailRight: PALETTE.voidPurple
    }
  }
];

export const getSectorAtZ = (z: number): SectorConfig => {
  for (let i = SECTORS.length - 1; i >= 0; i--) {
    if (z >= SECTORS[i].startZ) {
      return SECTORS[i];
    }
  }
  return SECTORS[0];
};

export interface SectorTransition {
  currentSector: SectorConfig;
  nextSector: SectorConfig | null;
  t: number; // 0 to 1 transition ratio (0 if not in transition)
}

export const getSectorTransition = (z: number): SectorTransition => {
  let currentIdx = 0;
  for (let i = SECTORS.length - 1; i >= 0; i--) {
    if (z >= SECTORS[i].startZ) {
      currentIdx = i;
      break;
    }
  }

  if (currentIdx === SECTORS.length - 1) {
    return {
      currentSector: SECTORS[currentIdx],
      nextSector: null,
      t: 0
    };
  }

  const nextSector = SECTORS[currentIdx + 1];
  const transitionStart = nextSector.startZ - 200;
  const transitionEnd = nextSector.startZ + 100;
  const transitionWidth = transitionEnd - transitionStart;

  if (z >= transitionStart && z <= transitionEnd) {
    const t = (z - transitionStart) / transitionWidth;
    return {
      currentSector: SECTORS[currentIdx],
      nextSector,
      t
    };
  }

  return {
    currentSector: SECTORS[currentIdx],
    nextSector: null,
    t: 0
  };
};
