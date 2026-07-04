import { LANES, PALETTE } from '../../config/gameConfig';
import type { Obstacle, Crystal, PowerUp } from '../types';

export const spawnChunk = (
  nextSpawnZ: number,
  obstacles: Obstacle[],
  crystals: Crystal[],
  powerUps: PowerUp[]
): void => {
  const patternType = Math.random();
  const shuffledLanes = [...LANES].sort(() => Math.random() - 0.5);

  if (patternType < 0.4) {
    // Double lane obstacle (Harder, leaves 1 lane open)
    const blockedLane1 = shuffledLanes[0];
    const blockedLane2 = shuffledLanes[1];
    const freeLane = shuffledLanes[2];

    const obstacleType = Math.random() > 0.5 ? 'WALL' : 'BARRIER';
    obstacles.push({
      id: `obs-double-1-${nextSpawnZ}`,
      x: blockedLane1,
      z: nextSpawnZ,
      width: 1.5,
      height: obstacleType === 'WALL' ? 3 : 1.2,
      type: obstacleType,
    });
    obstacles.push({
      id: `obs-double-2-${nextSpawnZ}`,
      x: blockedLane2,
      z: nextSpawnZ,
      width: 1.5,
      height: obstacleType === 'WALL' ? 3 : 1.2,
      type: obstacleType,
    });

    if (Math.random() > 0.3) {
      crystals.push({
        id: `cry-${nextSpawnZ}`,
        x: freeLane,
        z: nextSpawnZ + (Math.random() * 10 - 5),
        collected: false,
        color: PALETTE.neonCyan,
      });
    }
  } else if (patternType < 0.8) {
    // Single lane obstacle
    const blockedLane = shuffledLanes[0];
    const freeLane1 = shuffledLanes[1];
    const freeLane2 = shuffledLanes[2];

    obstacles.push({
      id: `obs-single-${nextSpawnZ}`,
      x: blockedLane,
      z: nextSpawnZ,
      width: 1.5,
      height: 2,
      type: 'BARRIER',
    });

    if (Math.random() > 0.4) {
      crystals.push({
        id: `cry-1-${nextSpawnZ}`,
        x: freeLane1,
        z: nextSpawnZ - 5,
        collected: false,
        color: PALETTE.hotPink,
      });
    }
    if (Math.random() > 0.4) {
      crystals.push({
        id: `cry-2-${nextSpawnZ}`,
        x: freeLane2,
        z: nextSpawnZ + 5,
        collected: false,
        color: PALETTE.neonYellow,
      });
    }
  } else {
    // No obstacles, just crystals lined up
    const lane = LANES[Math.floor(Math.random() * LANES.length)];
    for (let i = 0; i < 3; i++) {
      crystals.push({
        id: `cry-line-${i}-${nextSpawnZ}`,
        x: lane,
        z: nextSpawnZ + (i * 8) - 8,
        collected: false,
        color: PALETTE.voidPurple,
      });
    }
  }

  // Spawn track power-up collectibles with 12% probability
  if (Math.random() < 0.12) {
    const pTypes: ('SHIELD' | 'MAGNET' | 'SLOWMO')[] = ['SHIELD', 'MAGNET', 'SLOWMO'];
    const randomType = pTypes[Math.floor(Math.random() * pTypes.length)];
    const randomLane = LANES[Math.floor(Math.random() * LANES.length)];
    powerUps.push({
      id: `pw-${randomType}-${nextSpawnZ}`,
      x: randomLane,
      z: nextSpawnZ + 15,
      type: randomType,
      collected: false,
    });
  }
};
