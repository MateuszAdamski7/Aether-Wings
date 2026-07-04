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
      hazard: '#ff0055',
      accent: '#ffe600',
      skyBottom: '#ff8c00',
      skyTop: '#ff0080',
      fog: '#03030c',
      star1: '#00f3ff',
      star2: '#ff007f',
      mountainLeft: '#00f3ff',
      mountainRight: '#ff007f'
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
      hazard: '#ffaa00',
      accent: '#39ff14',
      skyBottom: '#ff5500',
      skyTop: '#ffe600',
      fog: '#011408',
      star1: '#39ff14',
      star2: '#ffe600',
      mountainLeft: '#39ff14',
      mountainRight: '#ffe600'
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
      hazard: '#9d00ff',
      accent: '#ffe600',
      skyBottom: '#7a00ff',
      skyTop: '#ff003c',
      fog: '#090214',
      star1: '#ff0000',
      star2: '#7a00ff',
      mountainLeft: '#ff0000',
      mountainRight: '#9d00ff'
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
