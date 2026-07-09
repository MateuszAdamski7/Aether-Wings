import type { StateCreator } from 'zustand';
import type { GameStore, GameSlice, Mission, RunStats, Obstacle, Crystal, PowerUp, ShipModifier } from './types';
import { 
  LANES, 
  SPAWN_INTERVAL, 
  INITIAL_SPEED, 
  MAX_SPEED, 
  getSectorAtZ, 
  BOOST_DURATION,
  CLEANUP_THRESHOLD_Z
} from '../config/gameConfig';
import { generateRandomMission } from './missionUtils';
import { audioManager } from '../utils/audio';
import { spawnChunk } from './utils/obstacleSpawner';
import { checkObstacleCollisions, checkCrystalCollisions, checkPowerUpCollisions } from './utils/collisionSystem';

interface BoostAndSpeedParams {
  boostActive: boolean;
  boostTimeRemaining: number;
  boostCharge: number;
  blastActiveTime: number;
  targetX: number;
  preBoostSpeed: number;
  speed: number;
  maxSpeed: number;
  playerZ: number;
  obstacles: Obstacle[];
  physicsDt: number;
  activeModifiers: ShipModifier[];
}

interface BoostAndSpeedResult {
  currentSpeed: number;
  nextBoostActive: boolean;
  nextBoostTime: number;
  nextBoostCharge: number;
  nextBlastActiveTime: number;
  nextTargetX: number;
  nextPreBoostSpeed: number;
  newObstacles: Obstacle[];
}

const updateBoostAndSpeed = ({
  boostActive,
  boostTimeRemaining,
  boostCharge,
  blastActiveTime,
  targetX,
  preBoostSpeed,
  speed,
  maxSpeed,
  playerZ,
  obstacles,
  physicsDt,
  activeModifiers,
}: BoostAndSpeedParams): BoostAndSpeedResult => {
  let currentSpeed: number;
  let nextBoostActive = boostActive;
  let nextBoostTime = boostTimeRemaining;
  let nextBoostCharge = boostCharge;
  let nextBlastActiveTime = blastActiveTime;
  let nextTargetX = targetX;
  let nextPreBoostSpeed = preBoostSpeed;
  let newObstacles = [...obstacles];

  if (boostActive) {
    nextBoostTime = boostTimeRemaining - physicsDt;
    const extraBoostSpeed = activeModifiers.reduce(
      (s, mod) => mod.modifyExtraBoostSpeed ? mod.modifyExtraBoostSpeed(s) : s,
      25
    );
    const targetBoostSpeed = maxSpeed + extraBoostSpeed;

    if (nextBoostTime > 1.0) {
      const t = Math.min(1.0, physicsDt * 2.8);
      currentSpeed = speed + (targetBoostSpeed - speed) * t;
    } else if (nextBoostTime > 0) {
      currentSpeed = preBoostSpeed + (targetBoostSpeed - preBoostSpeed) * nextBoostTime;
    } else {
      nextBoostActive = false;
      nextBoostTime = 0;
      nextBoostCharge = 0;
      nextBlastActiveTime = 0.45;
      currentSpeed = preBoostSpeed;
      nextPreBoostSpeed = 0;

      const blastRangeZ = 80;
      newObstacles = newObstacles.map((obs) => {
        const zDiff = obs.z - playerZ;
        if (zDiff > 0 && zDiff < blastRangeZ) {
          return { ...obs, destroyed: true };
        }
        return obs;
      });
      audioManager.playBlastFx();
    }
    nextTargetX = 0;
  } else {
    const speedIncrease = 0.4 * physicsDt;
    currentSpeed = Math.min(maxSpeed, speed + speedIncrease);
    nextPreBoostSpeed = 0;
  }

  return {
    currentSpeed,
    nextBoostActive,
    nextBoostTime,
    nextBoostCharge,
    nextBlastActiveTime,
    nextTargetX,
    nextPreBoostSpeed,
    newObstacles,
  };
};

interface SpawningAndCleanupParams {
  lastSpawnedZ: number;
  playerZ: number;
  obstacles: Obstacle[];
  crystals: Crystal[];
  powerUps: PowerUp[];
}

interface SpawningAndCleanupResult {
  nextSpawnZ: number;
  newObstacles: Obstacle[];
  newCrystals: Crystal[];
  newPowerUps: PowerUp[];
}

const handleSpawningAndCleanup = ({
  lastSpawnedZ,
  playerZ,
  obstacles,
  crystals,
  powerUps,
}: SpawningAndCleanupParams): SpawningAndCleanupResult => {
  let nextSpawnZ = lastSpawnedZ;
  let newObstacles = [...obstacles];
  let newCrystals = [...crystals];
  let newPowerUps = [...powerUps];

  if (playerZ + SPAWN_INTERVAL * 5 > nextSpawnZ) {
    spawnChunk(nextSpawnZ, newObstacles, newCrystals, newPowerUps);
    nextSpawnZ += SPAWN_INTERVAL;
  }

  newObstacles = newObstacles.filter((o) => o.z > playerZ - CLEANUP_THRESHOLD_Z && !o.destroyed);
  newCrystals = newCrystals.filter((c) => c.z > playerZ - CLEANUP_THRESHOLD_Z && !c.collected);
  newPowerUps = newPowerUps.filter((pw) => pw.z > playerZ - CLEANUP_THRESHOLD_Z && !pw.collected);

  return {
    nextSpawnZ,
    newObstacles,
    newCrystals,
    newPowerUps,
  };
};

interface CollisionTickParams {
  obstacles: Obstacle[];
  crystals: Crystal[];
  powerUps: PowerUp[];
  playerZ: number;
  shipX: number;
  boostActive: boolean;
  shieldActive: boolean;
  shieldStrength: number;
  magnetActiveTime: number;
  slowMoActiveTime: number;
  currentSpeed: number;
  physicsDt: number;
  getMagnetRadius: (nextMagnetActiveTime: number) => number;
  activeModifiers: ShipModifier[];
}

interface CollisionTickResult {
  collisionDetected: boolean;
  shieldActive: boolean;
  shieldStrength: number;
  obstaclesDestroyedCount: number;
  newObstacles: Obstacle[];
  crystalsCollectedCount: number;
  newCrystals: Crystal[];
  magnetActiveTime: number;
  slowMoActiveTime: number;
  newPowerUps: PowerUp[];
}

const handleCollisions = ({
  obstacles,
  crystals,
  powerUps,
  playerZ,
  shipX,
  boostActive,
  shieldActive,
  shieldStrength,
  magnetActiveTime,
  slowMoActiveTime,
  currentSpeed,
  physicsDt,
  getMagnetRadius,
  activeModifiers,
}: CollisionTickParams): CollisionTickResult => {
  const shipWidth = 1.0;
  const shipLength = 1.5;

  let newObstacles = [...obstacles];
  const newCrystals = [...crystals];
  const newPowerUps = [...powerUps];

  const obsResult = checkObstacleCollisions({
    obstacles: newObstacles,
    playerZ,
    shipX,
    shipLength,
    shipWidth,
    boostActive,
    shieldActive,
    shieldStrength,
  });

  if (obsResult.collisionDetected) {
    return {
      collisionDetected: true,
      shieldActive,
      shieldStrength,
      obstaclesDestroyedCount: 0,
      newObstacles,
      crystalsCollectedCount: 0,
      newCrystals,
      magnetActiveTime,
      slowMoActiveTime,
      newPowerUps,
    };
  }

  let nextShieldActive = obsResult.shieldActive;
  let nextShieldStrength = obsResult.shieldStrength;
  const obstaclesDestroyedCount = obsResult.obstaclesDestroyed;

  if (obstaclesDestroyedCount > 0) {
    newObstacles = newObstacles.filter((o) => !o.destroyed);
  }

  const magnetRadius = getMagnetRadius(magnetActiveTime);

  const cryResult = checkCrystalCollisions({
    crystals: newCrystals,
    playerZ,
    shipX,
    shipLength,
    shipWidth,
    magnetRadius,
    currentSpeed,
    physicsDt,
  });
  const crystalsCollectedCount = cryResult.crystalsCollected;

  const shieldCapacity = activeModifiers.reduce(
    (c, mod) => mod.modifyShieldPowerUpCapacity ? mod.modifyShieldPowerUpCapacity(c) : c,
    1
  );
  const magnetDuration = activeModifiers.reduce(
    (d, mod) => mod.modifyMagnetPowerUpDuration ? mod.modifyMagnetPowerUpDuration(d) : d,
    8.0
  );
  const slowMoDuration = activeModifiers.reduce(
    (d, mod) => mod.modifySlowMoPowerUpDuration ? mod.modifySlowMoPowerUpDuration(d) : d,
    5.0
  );

  const pwResult = checkPowerUpCollisions({
    powerUps: newPowerUps,
    playerZ,
    shipX,
    shipLength,
    shipWidth,
    shieldCapacity,
    magnetDuration,
    slowMoDuration,
  });

  let nextMagnetActiveTime = magnetActiveTime;
  let nextSlowMoActiveTime = slowMoActiveTime;

  if (pwResult.shieldActive !== null) {
    nextShieldActive = pwResult.shieldActive;
    nextShieldStrength = pwResult.shieldStrength ?? 1;
  }
  if (pwResult.magnetActiveTime !== null) {
    nextMagnetActiveTime = pwResult.magnetActiveTime;
  }
  if (pwResult.slowMoActiveTime !== null) {
    nextSlowMoActiveTime = pwResult.slowMoActiveTime;
  }

  return {
    collisionDetected: false,
    shieldActive: nextShieldActive,
    shieldStrength: nextShieldStrength,
    obstaclesDestroyedCount,
    newObstacles,
    crystalsCollectedCount,
    newCrystals,
    magnetActiveTime: nextMagnetActiveTime,
    slowMoActiveTime: nextSlowMoActiveTime,
    newPowerUps,
  };
};

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => {
  const savedHighScore = localStorage.getItem('aether_high_score');
  const initialHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

  const canMove = (): boolean => {
    const { gameState, boostActive } = get();
    return gameState === 'PLAYING' && !boostActive;
  };

  const saveNewRecord = (): void => {
    const { score, highScore } = get();
    if (score > highScore) {
      localStorage.setItem('aether_high_score', String(score));
      set({ highScore: score });
    }
  };

  const canActivateBoost = (): boolean => {
    const { gameState, boostCharge, boostActive, collisionTriggered } = get();
    return gameState === 'PLAYING' && boostCharge >= 10 && !boostActive && !collisionTriggered;
  };

  const moveTo = (targetX: number, controlMode: 'KEYBOARD' | 'MOUSE' = 'KEYBOARD'): void => {
    set({
      targetX,
      controlMode,
    });
  };

  const getMagnetRadius = (nextMagnetActiveTime: number): number => {
    const { activeModifiers } = get();
    const baseRadius = nextMagnetActiveTime > 0 ? 6.0 : 0.0;
    return activeModifiers.reduce((r, mod) => mod.modifyMagnetRadius ? mod.modifyMagnetRadius(r, nextMagnetActiveTime > 0) : r, baseRadius);
  };

  const updateMissions = (
    activeMissions: Mission[],
    newDistance: number,
    newRunStats: RunStats,
    lifetimeCrystals: number
  ) => {
    let nextLifetimeCrystals = lifetimeCrystals;
    const nextMissions = activeMissions.map((m) => {
      if (m.completed) return m;

      let current = m.current;
      if (m.type === 'DISTANCE') {
        current = Math.floor(newDistance);
      } else if (m.type === 'CRYSTALS') {
        current = newRunStats.crystalsCollected;
      } else if (m.type === 'HYPERBOOST') {
        current = newRunStats.boostsTriggered;
      } else if (m.type === 'CRUSH_OBSTACLES') {
        current = newRunStats.obstaclesCrushed;
      }

      const completed = current >= m.target;
      return { ...m, current: Math.min(m.target, current), completed };
    });

    const newlyCompleted = nextMissions.find(
      (m, idx) => m.completed && !activeMissions[idx].completed
    );

    let recentSuccess: { id: string; description: string; reward: number } | null = null;
    if (newlyCompleted) {
      recentSuccess = {
        id: newlyCompleted.id,
        description: newlyCompleted.description,
        reward: newlyCompleted.reward
      };
      audioManager.playMissionSuccessFx();
      nextLifetimeCrystals += newlyCompleted.reward;
      saveLifetimeCrystals(nextLifetimeCrystals);
      localStorage.setItem('aether_active_missions', JSON.stringify(nextMissions));
    }

    return {
      nextMissions,
      nextLifetimeCrystals,
      recentSuccess,
    };
  };

  const saveLifetimeCrystals = (amount: number): void => {
    localStorage.setItem('aether_lifetime_crystals', String(amount));
  };

  return {
    gameState: 'START',
    score: 0,
    highScore: initialHighScore,
    crystalCount: 0,
    speed: INITIAL_SPEED,
    baseSpeed: INITIAL_SPEED,
    maxSpeed: MAX_SPEED,
    distance: 0,
    playerZ: 0,
    shipX: 0,
    targetX: 0,
    controlMode: 'KEYBOARD',
    isMuted: false,
    collisionTriggered: false,
    obstacles: [],
    crystals: [],
    powerUps: [],
    lastSpawnedZ: 0,
    boostCharge: 0,
    boostActive: false,
    boostTimeRemaining: 0,
    blastActiveTime: 0,
    preBoostSpeed: 0,
    shieldActive: false,
    shieldStrength: 0,
    shieldRegenTimer: 0,
    quantumShieldRegenerated: false,
    magnetActiveTime: 0,
    slowMoActiveTime: 0,
    currentSector: 1,
    runStats: { crystalsCollected: 0, boostsTriggered: 0, obstaclesCrushed: 0 },

    startGame: () => {
      const { upgrades, activeModifiers } = get();
      let shieldActive = false;
      let shieldStrength = 0;
      let newUpgrades = upgrades;

      if (upgrades.shieldBought) {
        shieldActive = true;
        shieldStrength = 1;
        newUpgrades = { ...upgrades, shieldBought: false };
        localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
      }

      set({
        gameState: 'PLAYING',
        score: 0,
        crystalCount: 0,
        speed: INITIAL_SPEED,
        distance: 0,
        playerZ: 0,
        shipX: 0,
        targetX: 0,
        controlMode: 'KEYBOARD',
        collisionTriggered: false,
        obstacles: [],
        crystals: [],
        powerUps: [],
        lastSpawnedZ: 150,
        boostCharge: 0,
        boostActive: false,
        boostTimeRemaining: 0,
        blastActiveTime: 0,
        preBoostSpeed: 0,
        shieldActive,
        shieldStrength,
        shieldRegenTimer: 0,
        quantumShieldRegenerated: false,
        magnetActiveTime: 0,
        slowMoActiveTime: 0,
        currentSector: 1,
        upgrades: newUpgrades,
        runStats: { crystalsCollected: 0, boostsTriggered: 0, obstaclesCrushed: 0 },
        activeMissions: get().activeMissions.map((m) => ({ ...m, current: 0, completed: false })),
        recentCompletedMission: null,
      });

      // Run startup modifier hooks
      activeModifiers.forEach((mod) => {
        if (mod.onStartGame) {
          mod.onStartGame(get(), set);
        }
      });

      // Spawn initial set of obstacles
      get().tick(0);
    },

    resetGame: () => {
      // Regenerate completed missions
      const finalMissions = get().activeMissions.map((m) => {
        if (m.completed) {
          return generateRandomMission();
        }
        return m;
      });
      localStorage.setItem('aether_active_missions', JSON.stringify(finalMissions));

      // Reset audio speed setting
      audioManager.setSlowMo(false);

      set({
        gameState: 'START',
        score: 0,
        crystalCount: 0,
        speed: INITIAL_SPEED,
        distance: 0,
        playerZ: 0,
        shipX: 0,
        targetX: 0,
        controlMode: 'KEYBOARD',
        collisionTriggered: false,
        obstacles: [],
        crystals: [],
        powerUps: [],
        lastSpawnedZ: 0,
        boostCharge: 0,
        boostActive: false,
        boostTimeRemaining: 0,
        blastActiveTime: 0,
        preBoostSpeed: 0,
        shieldActive: false,
        shieldStrength: 0,
        shieldRegenTimer: 0,
        quantumShieldRegenerated: false,
        magnetActiveTime: 0,
        slowMoActiveTime: 0,
        currentSector: 1,
        activeMissions: finalMissions,
        recentCompletedMission: null,
      });
    },

    setGameState: (state) => set({ gameState: state }),

    moveLeft: () => {
      if (!canMove()) return;
      const { targetX } = get();
      
      // Find the closest discrete lane index
      let closestLaneIndex = 0;
      let minDistance = Infinity;
      for (let i = 0; i < LANES.length; i++) {
        const dist = Math.abs(LANES[i] - targetX);
        if (dist < minDistance) {
          minDistance = dist;
          closestLaneIndex = i;
        }
      }

      const nextIndex = Math.max(0, closestLaneIndex - 1);
      moveTo(LANES[nextIndex], 'KEYBOARD');
    },

    moveRight: () => {
      if (!canMove()) return;
      const { targetX } = get();
      
      // Find the closest discrete lane index
      let closestLaneIndex = 0;
      let minDistance = Infinity;
      for (let i = 0; i < LANES.length; i++) {
        const dist = Math.abs(LANES[i] - targetX);
        if (dist < minDistance) {
          minDistance = dist;
          closestLaneIndex = i;
        }
      }

      const nextIndex = Math.min(LANES.length - 1, closestLaneIndex + 1);
      moveTo(LANES[nextIndex], 'KEYBOARD');
    },

    setMouseX: (x) => {
      if (!canMove()) return;
      // Clamp X position to track boundaries
      const clampedX = Math.max(-2.8, Math.min(2.8, x));
      set({ shipX: clampedX });
      moveTo(clampedX, 'MOUSE');
    },

    setShipX: (x) => set({ shipX: x }),

    collectCrystal: () => {},

    triggerCollision: () => {
      if (get().collisionTriggered) return;
      
      audioManager.playCrashFx();
      audioManager.stopMusic();
      set({ collisionTriggered: true, speed: 0, boostActive: false });

      // After screen shake/glitch effect, trigger game over
      setTimeout(() => {
        saveNewRecord();
        set({ gameState: 'GAME_OVER' });
      }, 800); // 800ms of delay to show collision effect
    },

    activateBoost: () => {
      if (!canActivateBoost()) return;

      audioManager.playBoostFx();
      const { speed, runStats, activeModifiers } = get();
      const boostDuration = activeModifiers.reduce(
        (d, mod) => mod.modifyBoostDuration ? mod.modifyBoostDuration(d) : d,
        BOOST_DURATION
      );
      set({
        boostActive: true,
        boostTimeRemaining: boostDuration,
        targetX: 0, // snap to center
        preBoostSpeed: speed, // Save speed from right before boost
        runStats: { ...runStats, boostsTriggered: runStats.boostsTriggered + 1 }
      });
    },

    tick: (dt) => {
      const state = get();
      if (state.gameState !== 'PLAYING') return;

      // 0. Slow-Mo Time Dilation
      const isSlowMo = state.slowMoActiveTime > 0;
      audioManager.setSlowMo(isSlowMo);

      const slowMoFactor = state.activeModifiers.reduce(
        (f, mod) => mod.modifySlowMoFactor ? mod.modifySlowMoFactor(f) : f,
        0.65
      );
      const physicsDt = dt * (isSlowMo ? slowMoFactor : 1.0);

      const decayedMagnetTime = Math.max(0, state.magnetActiveTime - dt);
      const decayedSlowMoTime = Math.max(0, state.slowMoActiveTime - dt);

      const boostSpeedRes = updateBoostAndSpeed({
        boostActive: state.boostActive,
        boostTimeRemaining: state.boostTimeRemaining,
        boostCharge: state.boostCharge,
        blastActiveTime: state.blastActiveTime ?? 0,
        targetX: state.targetX,
        preBoostSpeed: state.preBoostSpeed,
        speed: state.speed,
        maxSpeed: state.maxSpeed,
        playerZ: state.playerZ,
        obstacles: state.obstacles,
        physicsDt,
        activeModifiers: state.activeModifiers,
      });

      const currentSpeed = boostSpeedRes.currentSpeed;
      const nextBoostActive = boostSpeedRes.nextBoostActive;
      const nextBoostTime = boostSpeedRes.nextBoostTime;
      let nextBoostCharge = boostSpeedRes.nextBoostCharge;
      let nextBlastActiveTime = boostSpeedRes.nextBlastActiveTime;
      const nextTargetX = boostSpeedRes.nextTargetX;
      const nextPreBoostSpeed = boostSpeedRes.nextPreBoostSpeed;
      let newObstacles = boostSpeedRes.newObstacles;

      if (nextBlastActiveTime > 0) {
        nextBlastActiveTime = Math.max(0, nextBlastActiveTime - physicsDt);
      }

      // Update player progress
      const newPlayerZ = state.playerZ + currentSpeed * physicsDt;
      const newDistance = state.distance + currentSpeed * physicsDt;
      
      // Calculate score based on distance + crystal collections
      const newScore = state.score + Math.floor(currentSpeed * physicsDt * 0.1);

      // Determine current sector/biome based on player Z progress
      const currentSector = getSectorAtZ(newPlayerZ).id;

      for (const obs of newObstacles) {
        const obsSector = getSectorAtZ(obs.z);
        if (obsSector.hasSlidingObstacles && obs.id.includes('single')) {
          obs.x = Math.sin(obs.z * 0.1 + newPlayerZ * 0.04) * 2.0;
        }
        if (obsSector.hasPulsingObstacles && obs.type === 'BARRIER') {
          obs.height = 1.2 + Math.sin(newPlayerZ * 0.08) * 0.4;
        }
      }

      const collisionRes = handleCollisions({
        obstacles: newObstacles,
        crystals: state.crystals,
        powerUps: state.powerUps,
        playerZ: newPlayerZ,
        shipX: state.shipX,
        boostActive: nextBoostActive,
        shieldActive: state.shieldActive,
        shieldStrength: state.shieldStrength,
        magnetActiveTime: decayedMagnetTime,
        slowMoActiveTime: decayedSlowMoTime,
        currentSpeed,
        physicsDt,
        getMagnetRadius,
        activeModifiers: state.activeModifiers,
      });

      if (collisionRes.collisionDetected) {
        get().triggerCollision();
        return;
      }

      newObstacles = collisionRes.newObstacles;
      const newCrystals = collisionRes.newCrystals;
      const newPowerUps = collisionRes.newPowerUps;
      const nextShieldActive = collisionRes.shieldActive;
      const shieldStrength = collisionRes.shieldStrength;
      const nextMagnetActiveTime = collisionRes.magnetActiveTime;
      const nextSlowMoActiveTime = collisionRes.slowMoActiveTime;
      const obstaclesDestroyedThisFrameCount = collisionRes.obstaclesDestroyedCount;
      const crystalsCollectedThisFrame = collisionRes.crystalsCollectedCount;

      const spawnRes = handleSpawningAndCleanup({
        lastSpawnedZ: state.lastSpawnedZ,
        playerZ: newPlayerZ,
        obstacles: newObstacles,
        crystals: newCrystals,
        powerUps: newPowerUps,
      });

      const nextSpawnZ = spawnRes.nextSpawnZ;
      newObstacles = spawnRes.newObstacles;
      const finalCrystals = spawnRes.newCrystals;
      const finalPowerUps = spawnRes.newPowerUps;

      const crystalMultiplier = state.activeModifiers.reduce(
        (m, mod) => mod.modifyCrystalMultiplier ? mod.modifyCrystalMultiplier(m) : m,
        1
      );
      const crystalsEarnedThisFrame = crystalsCollectedThisFrame * crystalMultiplier;

      if (!nextBoostActive && crystalsCollectedThisFrame > 0) {
        const boostChargeRate = state.activeModifiers.reduce(
          (r, mod) => mod.modifyBoostChargeRate ? mod.modifyBoostChargeRate(r) : r,
          1.0
        );
        nextBoostCharge = Math.min(10, nextBoostCharge + crystalsEarnedThisFrame * boostChargeRate);
      }

      // Economy update: add collected crystals to lifetime count
      let nextLifetimeCrystals = state.lifetimeCrystals;
      if (crystalsCollectedThisFrame > 0) {
        nextLifetimeCrystals += crystalsEarnedThisFrame;
        saveLifetimeCrystals(nextLifetimeCrystals);
      }

      // Update runStats
      const newRunStats = {
        crystalsCollected: state.runStats.crystalsCollected + crystalsEarnedThisFrame,
        boostsTriggered: state.runStats.boostsTriggered,
        obstaclesCrushed: state.runStats.obstaclesCrushed + obstaclesDestroyedThisFrameCount
      };

      // Mission progress evaluations
      const {
        nextMissions,
        nextLifetimeCrystals: updatedLifetimeCrystals,
        recentSuccess
      } = updateMissions(
        state.activeMissions,
        newDistance,
        newRunStats,
        nextLifetimeCrystals
      );
      nextLifetimeCrystals = updatedLifetimeCrystals;

      const finalScore = newScore + (crystalsEarnedThisFrame * 500) + (obstaclesDestroyedThisFrameCount * 1000);
      const newCrystalCount = state.crystalCount + crystalsEarnedThisFrame;

      set({
        playerZ: newPlayerZ,
        distance: newDistance,
        speed: currentSpeed,
        score: finalScore,
        crystalCount: newCrystalCount,
        obstacles: newObstacles,
        crystals: finalCrystals,
        powerUps: finalPowerUps,
        lastSpawnedZ: nextSpawnZ,
        boostActive: nextBoostActive,
        boostTimeRemaining: nextBoostTime,
        boostCharge: nextBoostCharge,
        blastActiveTime: nextBlastActiveTime,
        targetX: nextTargetX,
        preBoostSpeed: nextPreBoostSpeed,

        shieldActive: nextShieldActive,
        shieldStrength,
        magnetActiveTime: nextMagnetActiveTime,
        slowMoActiveTime: nextSlowMoActiveTime,
        currentSector,
        activeMissions: nextMissions,
        lifetimeCrystals: nextLifetimeCrystals,
        runStats: newRunStats,
        ...(recentSuccess ? { recentCompletedMission: recentSuccess } : {})
      });

      // Run frame tick modifier hooks (handles auto-regen, Quantum shield regen, etc.)
      get().activeModifiers.forEach((mod) => {
        if (mod.onTick) {
          mod.onTick(physicsDt, get(), set);
        }
      });
    },
  };
};
