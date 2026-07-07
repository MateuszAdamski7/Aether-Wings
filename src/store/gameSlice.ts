import type { StateCreator } from 'zustand';
import type { GameStore, GameSlice } from './types';
import { LANES, SPAWN_INTERVAL, INITIAL_SPEED, MAX_SPEED, getSectorAtZ, BOOST_DURATION } from '../config/gameConfig';
import { generateRandomMission } from './missionUtils';
import { audioManager } from '../utils/audio';
import { spawnChunk } from './utils/obstacleSpawner';
import { checkObstacleCollisions, checkCrystalCollisions, checkPowerUpCollisions } from './utils/collisionSystem';

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => {
  // Load high score from local storage
  const savedHighScore = localStorage.getItem('aether_high_score');
  const initialHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

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
    isMuted: false, // will be overridden/synced by settingsSlice, but defined for TS interface compatibility
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
      const { upgrades } = get();
      let shieldActive = false;
      let shieldStrength = 0;
      let newUpgrades = upgrades;

      if (upgrades.defense_shield_1) {
        shieldActive = true;
        shieldStrength = upgrades.defense_shield_2 ? 2 : 1;
      } else if (upgrades.shieldBought) {
        shieldActive = true;
        shieldStrength = 1;
        newUpgrades = { ...upgrades, shieldBought: false };
        localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
      }

      // Quantum Vanguard passive: starts with shield
      if (upgrades.equippedSkin === 'quantum') {
        shieldActive = true;
        shieldStrength = Math.max(shieldStrength, 1);
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
        lastSpawnedZ: 150, // Start spawning obstacles after Z=150 (gives player ~5 seconds of clear runway)
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
      //
      // if gameState === playing (not game over nor start)
      //
      //TODO: move to canMove fun
      if (get().gameState !== 'PLAYING' || get().boostActive) return;
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

      // Move visual Right (decrement coordinate index)

      //
      // move right = move visual right, positive on X axis
      //
      const nextIndex = Math.max(0, closestLaneIndex - 1);
      set({
        targetX: LANES[nextIndex],
        controlMode: 'KEYBOARD',
      });
    },

    moveRight: () => {
      //
      // if gameState === playing (not game over nor start)
      //
      //TODO: move to canMove fun
      if (get().gameState !== 'PLAYING' || get().boostActive) return;
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

      // Move visual Left (increment coordinate index)

      //
      // move left = move visual left, negative on X axis
      //
      const nextIndex = Math.min(LANES.length - 1, closestLaneIndex + 1);
      set({
        targetX: LANES[nextIndex],
        controlMode: 'KEYBOARD',
      });
    },

    setMouseX: (x) => {
      if (get().gameState !== 'PLAYING' || get().boostActive) return;
      // Clamp X position to track boundaries
      const clampedX = Math.max(-2.8, Math.min(2.8, x));
      set({
        shipX: clampedX,
        targetX: clampedX, // synchronize targetX for keyboard transition
        controlMode: 'MOUSE',
      });
    },

    setShipX: (x) => set({ shipX: x }),

    collectCrystal: () => {},

    triggerCollision: () => {
      if (get().collisionTriggered) return;
      
      audioManager.playCrashFx();
      audioManager.stopMusic();
      set({ collisionTriggered: true, speed: 0, boostActive: false });

      // After screen shake/glitch effect, trigger game over

      //TODO: move to saveNewRecord fun
      setTimeout(() => {
        const { score, highScore } = get();
        if (score > highScore) {
          localStorage.setItem('aether_high_score', String(score));
          set({ highScore: score });
        }
        set({ gameState: 'GAME_OVER' });
      }, 800); // 800ms of delay to show collision effect
    },

    activateBoost: () => {
      const { gameState, boostCharge, boostActive, collisionTriggered, speed, runStats } = get();
      //TODO: isPlaying function
      if (gameState !== 'PLAYING' || boostActive || boostCharge < 10 || collisionTriggered) return;

      audioManager.playBoostFx();
      //todo: upgrades shouldnt be hardcoded here
      const boostDuration = get().upgrades.engine_boost_1 ? 6.0 : BOOST_DURATION;
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

      // Temporal Warp Wing passive: 0.45x time dilation factor instead of 0.65x
      //TODO: upgrades shouldnt be hardcoded here
      const slowMoFactor = state.upgrades.equippedSkin === 'temporal' ? 0.45 : 0.65;
      const physicsDt = dt * (isSlowMo ? slowMoFactor : 1.0);

      // Decays active power-up timers
      let nextMagnetActiveTime = Math.max(0, state.magnetActiveTime - dt);
      let nextSlowMoActiveTime = Math.max(0, state.slowMoActiveTime - dt);
      let nextShieldActive = state.shieldActive;
      let shieldStrength = state.shieldStrength;

      // 1. Boost timers & Speed overrides
      let currentSpeed: number;
      let nextBoostActive = state.boostActive;
      let nextBoostTime = state.boostTimeRemaining;
      let nextBoostCharge = state.boostCharge;
      let nextBlastActiveTime = state.blastActiveTime ?? 0;
      let nextTargetX = state.targetX;
      let nextPreBoostSpeed = state.preBoostSpeed;

      let newObstacles = [...state.obstacles];
      let newCrystals = [...state.crystals];
      let newPowerUps = [...state.powerUps];

      //todo: move to activateBoost fun
      if (state.boostActive) {
        nextBoostTime = state.boostTimeRemaining - physicsDt;
        //todo: as above
        const extraBoostSpeed = state.upgrades.engine_boost_3 ? 35 : 25;
        const targetBoostSpeed = state.maxSpeed + extraBoostSpeed;
        
        if (nextBoostTime > 1.0) {
          // Smoothly accelerate to match the 2.8 parts separation visual transition rate
          const t = Math.min(1.0, physicsDt * 2.8);
          currentSpeed = state.speed + (targetBoostSpeed - state.speed) * t;
        } else if (nextBoostTime > 0) {
          // Smoothly decay speed inside the boost effect over the last 1 second, reaching preBoostSpeed at exactly 0
          currentSpeed = state.preBoostSpeed + (targetBoostSpeed - state.preBoostSpeed) * nextBoostTime;
        } else {
          nextBoostActive = false;
          nextBoostTime = 0;
          nextBoostCharge = 0;
          nextBlastActiveTime = 0.45; // 450ms blast wave visual duration
          currentSpeed = state.preBoostSpeed; // Ensure it is exactly preBoostSpeed
          nextPreBoostSpeed = 0; // Clear it, decay is done!

          //todo: sonic blast should start a bit earlier
          // SONIC BLAST: Destroy all obstacles in front of player within 80 units
          const blastRangeZ = 80;

          //todo: adding/removing obstacles should be in its own function
          newObstacles = newObstacles.filter((obs) => {
            const zDiff = obs.z - state.playerZ;
            return !(zDiff > 0 && zDiff < blastRangeZ);
          });
          audioManager.playBlastFx();
        }
        // todo: moveTo function
        nextTargetX = 0; // Lock to middle lane
      } else {
        // Normal speed progression
        const speedIncrease = 0.4 * physicsDt;
        currentSpeed = Math.min(state.maxSpeed, state.speed + speedIncrease);
        nextPreBoostSpeed = 0;
      }

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

      // Spawning logic: spawn chunk if player approaches lastSpawnedZ

      //todo: move to new fun
      let nextSpawnZ = state.lastSpawnedZ;
      if (newPlayerZ + SPAWN_INTERVAL * 5 > nextSpawnZ) {
        spawnChunk(nextSpawnZ, newObstacles, newCrystals, newPowerUps);
        nextSpawnZ += SPAWN_INTERVAL;
      }

      // Cleanup elements that the player has passed (behind by more than 15 units)

      //todo: magic number
      newObstacles = newObstacles.filter((o) => o.z > newPlayerZ - 15);
      newCrystals = newCrystals.filter((c) => c.z > newPlayerZ - 15);
      newPowerUps = newPowerUps.filter((pw) => pw.z > newPlayerZ - 15);

      // Update moving obstacles based on dynamic sector configuration properties
      //move to external fun
      for (const obs of newObstacles) {
        const obsSector = getSectorAtZ(obs.z);
        if (obsSector.hasSlidingObstacles && obs.id.includes('single')) {
          // Slide barriers smoothly between -2.0 and +2.0
          obs.x = Math.sin(obs.z * 0.1 + newPlayerZ * 0.04) * 2.0;
        }
        if (obsSector.hasPulsingObstacles && obs.type === 'BARRIER') {
          // Pulse the scale/height of barriers
          obs.height = 1.2 + Math.sin(newPlayerZ * 0.08) * 0.4;
        }
      }

      // Perform collision checks inside frame tick
      const shipWidth = 1.0;
      const shipLength = 1.5;

      //todo: too many arguments, should be an object (collision check)
      const obsResult = checkObstacleCollisions(
        newObstacles,
        newPlayerZ,
        state.shipX,
        shipLength,
        shipWidth,
        nextBoostActive,
        nextShieldActive,
        shieldStrength
      );

      if (obsResult.collisionDetected) {
        get().triggerCollision();
        return;
      }

      nextShieldActive = obsResult.shieldActive;
      shieldStrength = obsResult.shieldStrength;
      const obstaclesDestroyedThisFrameCount = obsResult.obstaclesDestroyed;

      // Filter out destroyed obstacles
      //todo: magic number
      if (obstaclesDestroyedThisFrameCount > 0) {
        newObstacles = newObstacles.filter(o => o.z > -9000);
      }

      // Calculate magnet radius based on active power-up or permanent upgrade level
      //todo: should be new function(magnet radius)
      let magnetRadius = 0;
      if (nextMagnetActiveTime > 0) {
        magnetRadius = 6.0;
      } else if (state.upgrades.harvest_magnet_3) {
        magnetRadius = 15.0; // Draw everything from all lanes
      } else if (state.upgrades.harvest_magnet_2) {
        magnetRadius = 3.0;
      } else if (state.upgrades.harvest_magnet_1) {
        magnetRadius = 1.5;
      } else if (state.upgrades.magnetLevel > 0) {
        // Fallback for old save data compatibility
        const magRadii = [0, 1.5, 2.5, 4.0];
        magnetRadius = magRadii[state.upgrades.magnetLevel];
      }

      //todo: same as collision above
      const cryResult = checkCrystalCollisions(
        newCrystals,
        newPlayerZ,
        state.shipX,
        shipLength,
        shipWidth,
        magnetRadius,
        currentSpeed,
        physicsDt
      );
      const crystalsCollectedThisFrame = cryResult.crystalsCollected;

      //todo: same as above
      const pwResult = checkPowerUpCollisions(
        newPowerUps,
        newPlayerZ,
        state.shipX,
        shipLength,
        shipWidth,
        state.upgrades
      );

      if (pwResult.shieldActive !== null) {
        nextShieldActive = pwResult.shieldActive;
        shieldStrength = pwResult.shieldStrength ?? 1;
      }
      if (pwResult.magnetActiveTime !== null) {
        nextMagnetActiveTime = pwResult.magnetActiveTime;
      }
      if (pwResult.slowMoActiveTime !== null) {
        nextSlowMoActiveTime = pwResult.slowMoActiveTime;
      }

      // Vortex Singularity passive: double crystal earnings and boost charge rate
      //todo: upgrades
      const hasVortex = state.upgrades.equippedSkin === 'vortex';
      const crystalMultiplier = hasVortex ? 2 : 1;
      const crystalsEarnedThisFrame = crystalsCollectedThisFrame * crystalMultiplier;

      // Accumulate boost charge (max 10) if boost is not currently active
      //todo: XDDDDDD
      if (!nextBoostActive && crystalsCollectedThisFrame > 0) {
        const boostChargeRate = state.upgrades.engine_boost_2 ? 1.2 : 1.0;
        nextBoostCharge = Math.min(10, nextBoostCharge + crystalsEarnedThisFrame * boostChargeRate);
      }

      // Economy update: add collected crystals to lifetime count
      //todo: fun
      let nextLifetimeCrystals = state.lifetimeCrystals;
      if (crystalsCollectedThisFrame > 0) {
        nextLifetimeCrystals += crystalsEarnedThisFrame;
        localStorage.setItem('aether_lifetime_crystals', String(nextLifetimeCrystals));
      }

      // Update runStats
      const newRunStats = {
        crystalsCollected: state.runStats.crystalsCollected + crystalsEarnedThisFrame,
        boostsTriggered: state.runStats.boostsTriggered,
        obstaclesCrushed: state.runStats.obstaclesCrushed + obstaclesDestroyedThisFrameCount
      };

      // Mission progress evaluations
      //todo: fun
      const nextMissions = state.activeMissions.map((m) => {
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
        (m, idx) => m.completed && !state.activeMissions[idx].completed
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
        localStorage.setItem('aether_lifetime_crystals', String(nextLifetimeCrystals));
        localStorage.setItem('aether_active_missions', JSON.stringify(nextMissions));
      }

      const finalScore = newScore + (crystalsEarnedThisFrame * 500) + (obstaclesDestroyedThisFrameCount * 1000);
      const newCrystalCount = state.crystalCount + crystalsEarnedThisFrame;

      // Quantum Vanguard passive: regenerate shield once per run after Z >= 1500
      let nextQuantumShieldRegenerated = state.quantumShieldRegenerated;
      if (state.upgrades.equippedSkin === 'quantum' && !nextShieldActive && newPlayerZ >= 1500 && !nextQuantumShieldRegenerated) {
        nextShieldActive = true;
        shieldStrength = Math.max(shieldStrength, 1);
        nextQuantumShieldRegenerated = true;
        audioManager.playShieldPickupFx();
      }

      // Emergency Nano-Regen (defense_shield_3): regenerates shield in 40s when inactive
      let nextShieldRegenTimer = state.shieldRegenTimer ?? 0;
      if (state.upgrades.defense_shield_3 && !nextShieldActive) {
        if (nextShieldRegenTimer <= 0) {
          nextShieldRegenTimer = 40.0; // 40 seconds cooldown
        } else {
          nextShieldRegenTimer = Math.max(0, nextShieldRegenTimer - physicsDt);
          if (nextShieldRegenTimer <= 0) {
            nextShieldActive = true;
            shieldStrength = 1;
            audioManager.playShieldPickupFx();
          }
        }
      } else {
        nextShieldRegenTimer = 0;
      }

      set({
        playerZ: newPlayerZ,
        distance: newDistance,
        speed: currentSpeed,
        score: finalScore,
        crystalCount: newCrystalCount,
        obstacles: newObstacles,
        crystals: newCrystals,
        powerUps: newPowerUps,
        lastSpawnedZ: nextSpawnZ,
        boostActive: nextBoostActive,
        boostTimeRemaining: nextBoostTime,
        boostCharge: nextBoostCharge,
        blastActiveTime: nextBlastActiveTime,
        targetX: nextTargetX,
        preBoostSpeed: nextPreBoostSpeed,

        shieldActive: nextShieldActive,
        shieldStrength,
        shieldRegenTimer: nextShieldRegenTimer,
        quantumShieldRegenerated: nextQuantumShieldRegenerated,
        magnetActiveTime: nextMagnetActiveTime,
        slowMoActiveTime: nextSlowMoActiveTime,
        currentSector,
        activeMissions: nextMissions,
        lifetimeCrystals: nextLifetimeCrystals,
        runStats: newRunStats,
        ...(recentSuccess ? { recentCompletedMission: recentSuccess } : {})
      });
    },
  };
};
