import type { World } from '../types';
import { LANES, SPAWN_INTERVAL } from '../../config/gameConfig';
import { SECTOR_1_END_Z } from '../../config/sectors';

export function spawnSystem(world: World): void {
  const spawnHorizon = world.player.z + 180;
  let nextSpawnZ = world.lastSpawnedZ;

  let obstaclesChanged = false;
  let crystalsChanged = false;
  let powerUpsChanged = false;

  let newObstacles = world.obstacles;
  let newCrystals = world.crystals;
  let newPowerUps = world.powerUps;

  while (nextSpawnZ < spawnHorizon) {
    if (!obstaclesChanged) {
      newObstacles = [...newObstacles];
      obstaclesChanged = true;
    }
    if (!crystalsChanged) {
      newCrystals = [...newCrystals];
      crystalsChanged = true;
    }
    if (!powerUpsChanged) {
      newPowerUps = [...newPowerUps];
      powerUpsChanged = true;
    }

    const patternType = world.rng();
    const shuffledLanes = [...LANES].sort(() => world.rng() - 0.5);

    if (patternType < 0.4) {
      // Double lane obstacle (Harder, leaves 1 lane open)
      const blockedLane1 = shuffledLanes[0];
      const blockedLane2 = shuffledLanes[1];
      const freeLane = shuffledLanes[2];

      const obstacleType = world.rng() > 0.5 ? 'WALL' : 'BARRIER';
      newObstacles.push({
        id: `obs-double-1-${nextSpawnZ}`,
        x: blockedLane1,
        z: nextSpawnZ,
        width: 1.5,
        height: obstacleType === 'WALL' ? 3 : 1.2,
        type: obstacleType,
      });
      newObstacles.push({
        id: `obs-double-2-${nextSpawnZ}`,
        x: blockedLane2,
        z: nextSpawnZ,
        width: 1.5,
        height: obstacleType === 'WALL' ? 3 : 1.2,
        type: obstacleType,
      });

      if (world.rng() > 0.3) {
        newCrystals.push({
          id: `cry-${nextSpawnZ}`,
          x: freeLane,
          z: nextSpawnZ + (world.rng() * 10 - 5),
          collected: false,
          color: '#00f3ff',
        });
      }
    } else if (patternType < 0.8) {
      // Single lane obstacle
      const blockedLane = shuffledLanes[0];
      const freeLane1 = shuffledLanes[1];
      const freeLane2 = shuffledLanes[2];

      newObstacles.push({
        id: `obs-single-${nextSpawnZ}`,
        x: blockedLane,
        z: nextSpawnZ,
        width: 1.5,
        height: 2,
        type: 'BARRIER',
      });

      if (world.rng() > 0.4) {
        newCrystals.push({
          id: `cry-1-${nextSpawnZ}`,
          x: freeLane1,
          z: nextSpawnZ - 5,
          collected: false,
          color: '#ff007f',
        });
      }
      if (world.rng() > 0.4) {
        newCrystals.push({
          id: `cry-2-${nextSpawnZ}`,
          x: freeLane2,
          z: nextSpawnZ + 5,
          collected: false,
          color: '#ffe600',
        });
      }
    } else {
      // No obstacles, just crystals lined up
      const lane = LANES[Math.floor(world.rng() * LANES.length)];
      for (let i = 0; i < 3; i++) {
        newCrystals.push({
          id: `cry-line-${i}-${nextSpawnZ}`,
          x: lane,
          z: nextSpawnZ + (i * 8) - 8,
          collected: false,
          color: '#9d00ff',
        });
      }
    }

    // Spawn track power-up collectibles with 15% probability
    if (world.rng() < 0.15) {
      const powerLane = shuffledLanes[Math.floor(world.rng() * shuffledLanes.length)];
      const powerType = world.rng() > 0.5 ? 'SHIELD' : 'MAGNET';
      newPowerUps.push({
        id: `pw-${nextSpawnZ}`,
        x: powerLane,
        z: nextSpawnZ + 15,
        type: powerType,
        collected: false,
      });
    }

    nextSpawnZ += SPAWN_INTERVAL;
  }

  world.lastSpawnedZ = nextSpawnZ;

  // Cleanup elements far behind player
  const cutoffZ = world.player.z - 15;
  if (newObstacles.length > 0 && newObstacles[0].z <= cutoffZ) {
    let cut = 0;
    while (cut < newObstacles.length && newObstacles[cut].z <= cutoffZ) cut++;
    newObstacles = newObstacles.slice(cut);
    obstaclesChanged = true;
  }
  if (newCrystals.length > 0 && newCrystals[0].z <= cutoffZ) {
    let cut = 0;
    while (cut < newCrystals.length && newCrystals[cut].z <= cutoffZ) cut++;
    newCrystals = newCrystals.slice(cut);
    crystalsChanged = true;
  }
  if (newPowerUps.length > 0 && newPowerUps[0].z <= cutoffZ) {
    let cut = 0;
    while (cut < newPowerUps.length && newPowerUps[cut].z <= cutoffZ) cut++;
    newPowerUps = newPowerUps.slice(cut);
    powerUpsChanged = true;
  }

  // Update moving obstacles for Sectors 2 and 3 based on their Z coordinate position
  for (const obs of newObstacles) {
    if (obs.z >= SECTOR_1_END_Z && obs.id.includes('single')) {
      obs.x = Math.sin(obs.z * 0.1 + world.player.z * 0.04) * 2.0;
    }
  }

  if (obstaclesChanged) world.obstacles = newObstacles;
  if (crystalsChanged) world.crystals = newCrystals;
  if (powerUpsChanged) world.powerUps = newPowerUps;
}
