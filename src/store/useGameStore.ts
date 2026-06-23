import { create } from 'zustand';
import { audioManager } from '../utils/audio';

export type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export interface Obstacle {
  id: string;
  x: number; // lane position (-2, 0, 2)
  z: number; // Z distance
  width: number;
  height: number;
  type: 'WALL' | 'BARRIER' | 'ARCH';
}

export interface Crystal {
  id: string;
  x: number; // lane position (-2, 0, 2)
  z: number; // Z distance
  collected: boolean;
  color: string;
}

export interface PowerUp {
  id: string;
  x: number;
  z: number;
  type: 'SHIELD' | 'MAGNET' | 'SLOWMO';
  collected: boolean;
}

export interface Mission {
  id: string;
  type: 'DISTANCE' | 'CRYSTALS' | 'HYPERBOOST' | 'CRUSH_OBSTACLES';
  description: string;
  target: number;
  current: number;
  reward: number;
  completed: boolean;
}

const MISSION_TEMPLATES = [
  { type: 'DISTANCE', description: 'Travel $targetm in a single run', targets: [1000, 1500, 2000, 2500], rewardBase: 10 },
  { type: 'CRYSTALS', description: 'Collect $target crystals in a single run', targets: [15, 25, 40, 50], rewardBase: 12 },
  { type: 'HYPERBOOST', description: 'Trigger Hyperboost $target times in a single run', targets: [1, 2, 3], rewardBase: 15 },
  { type: 'CRUSH_OBSTACLES', description: 'Smash $target obstacles in Hyperboost', targets: [3, 6, 9], rewardBase: 15 }
];

export function generateRandomMission(): Mission {
  const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
  const targetIndex = Math.floor(Math.random() * template.targets.length);
  const target = template.targets[targetIndex];
  const reward = template.rewardBase + targetIndex * 5;
  const description = template.description.replace('$target', String(target));
  return {
    id: `mission-${Math.random().toString(36).substr(2, 9)}`,
    type: template.type as any,
    description,
    target,
    current: 0,
    reward,
    completed: false,
  };
}

interface GameStore {
  // Game state variables
  gameState: GameState;
  score: number;
  highScore: number;
  crystalCount: number;
  speed: number;
  baseSpeed: number;
  maxSpeed: number;
  distance: number;
  playerZ: number;
  shipX: number;
  targetX: number;
  controlMode: 'KEYBOARD' | 'MOUSE';
  isMuted: boolean;
  collisionTriggered: boolean;

  // Track elements
  obstacles: Obstacle[];
  crystals: Crystal[];
  powerUps: PowerUp[];
  lastSpawnedZ: number;

  // Boost mechanics
  boostCharge: number; // 0 to 10
  boostActive: boolean;
  boostTimeRemaining: number;
  blastActiveTime: number;
  preBoostSpeed: number;

  // Meta-Progression & Gameplay Expansion
  lifetimeCrystals: number;
  upgrades: {
    magnetLevel: number;
    shieldBought: boolean;
    unlockedSkins: string[];
    equippedSkin: string;
  };
  shieldActive: boolean;
  quantumShieldRegenerated: boolean;
  magnetActiveTime: number;
  slowMoActiveTime: number;
  currentSector: 1 | 2 | 3;
  activeMissions: Mission[];
  runStats: {
    crystalsCollected: number;
    boostsTriggered: number;
    obstaclesCrushed: number;
  };
  recentCompletedMission: { id: string; description: string; reward: number } | null;
  menuTab: 'PLAY' | 'GARAGE' | 'MISSIONS';

  // Actions
  startGame: () => void;
  resetGame: () => void;
  setGameState: (state: GameState) => void;
  moveLeft: () => void;
  moveRight: () => void;
  setMouseX: (x: number) => void;
  setShipX: (x: number) => void;
  toggleMute: () => void;
  collectCrystal: (id: string) => void;
  triggerCollision: () => void;
  activateBoost: () => void;
  tick: (dt: number) => void;

  buyUpgrade: (type: 'MAGNET' | 'SHIELD') => void;
  buySkin: (skinId: string, cost: number) => void;
  equipSkin: (skinId: string) => void;
  clearCompletedMissionNotification: () => void;
  setMenuTab: (tab: 'PLAY' | 'GARAGE' | 'MISSIONS') => void;
}

const LANES = [-2, 0, 2];
const SPAWN_INTERVAL = 35; // Spawn an obstacle group every 35 units
const INITIAL_SPEED = 28;
const MAX_SPEED = 70;

export const useGameStore = create<GameStore>((set, get) => {
  // Load high score from local storage
  const savedHighScore = localStorage.getItem('aether_high_score');
  const initialHighScore = savedHighScore ? parseInt(savedHighScore, 10) : 0;

  // Load sound setting
  const savedMute = localStorage.getItem('aether_muted');
  const initialMute = savedMute ? savedMute === 'true' : false;

  // Load lifetime crystals and upgrades
  const savedCrystals = localStorage.getItem('aether_lifetime_crystals');
  const initialLifetimeCrystals = savedCrystals ? parseInt(savedCrystals, 10) : 0;

  const savedUpgrades = localStorage.getItem('aether_upgrades');
  const initialUpgrades = savedUpgrades ? JSON.parse(savedUpgrades) : {
    magnetLevel: 0,
    shieldBought: false,
    unlockedSkins: ['pink'],
    equippedSkin: 'pink'
  };

  const savedMissions = localStorage.getItem('aether_active_missions');
  const initialMissions = savedMissions ? JSON.parse(savedMissions) : [
    generateRandomMission(),
    generateRandomMission(),
    generateRandomMission()
  ];

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
    isMuted: initialMute,
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

    lifetimeCrystals: initialLifetimeCrystals,
    upgrades: initialUpgrades,
    shieldActive: false,
    quantumShieldRegenerated: false,
    magnetActiveTime: 0,
    slowMoActiveTime: 0,
    currentSector: 1,
    activeMissions: initialMissions,
    runStats: { crystalsCollected: 0, boostsTriggered: 0, obstaclesCrushed: 0 },
    recentCompletedMission: null,
    menuTab: 'PLAY',

    startGame: () => {
      const { upgrades } = get();
      let shieldActive = false;
      let newUpgrades = upgrades;
      if (upgrades.shieldBought) {
        shieldActive = true;
        newUpgrades = { ...upgrades, shieldBought: false };
        localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
      }

      // Quantum Vanguard passive: starts with shield
      if (upgrades.equippedSkin === 'quantum') {
        shieldActive = true;
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
      if (get().gameState !== 'PLAYING' || get().boostActive) return;
      const { targetX } = get();
      const currentLaneIndex = LANES.indexOf(targetX);
      if (currentLaneIndex > 0) {
        set({
          targetX: LANES[currentLaneIndex - 1],
          controlMode: 'KEYBOARD',
        });
      }
    },

    moveRight: () => {
      if (get().gameState !== 'PLAYING' || get().boostActive) return;
      const { targetX } = get();
      const currentLaneIndex = LANES.indexOf(targetX);
      if (currentLaneIndex < LANES.length - 1) {
        set({
          targetX: LANES[currentLaneIndex + 1],
          controlMode: 'KEYBOARD',
        });
      }
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

    toggleMute: () => {
      const newMuted = !get().isMuted;
      localStorage.setItem('aether_muted', String(newMuted));
      audioManager.setMute(newMuted);
      set({ isMuted: newMuted });
    },

    collectCrystal: () => {},

    triggerCollision: () => {
      if (get().collisionTriggered) return;
      
      audioManager.playCrashFx();
      audioManager.stopMusic();
      set({ collisionTriggered: true, speed: 0, boostActive: false });

      // After screen shake/glitch effect, trigger game over
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
      if (gameState !== 'PLAYING' || boostActive || boostCharge < 10 || collisionTriggered) return;

      audioManager.playBoostFx();
      set({
        boostActive: true,
        boostTimeRemaining: 5.0,
        targetX: 0, // snap to center
        preBoostSpeed: speed, // Save speed from right before boost
        runStats: { ...runStats, boostsTriggered: runStats.boostsTriggered + 1 }
      });
    },

    buyUpgrade: (type) => {
      const { lifetimeCrystals, upgrades } = get();
      if (type === 'MAGNET') {
        const magnetCosts = [30, 50, 80];
        const currentLevel = upgrades.magnetLevel;
        if (currentLevel >= 3) return;
        const cost = magnetCosts[currentLevel];
        if (lifetimeCrystals >= cost) {
          const newUpgrades = { ...upgrades, magnetLevel: currentLevel + 1 };
          localStorage.setItem('aether_lifetime_crystals', String(lifetimeCrystals - cost));
          localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
          set({
            lifetimeCrystals: lifetimeCrystals - cost,
            upgrades: newUpgrades
          });
        }
      } else if (type === 'SHIELD') {
        const cost = 25;
        if (!upgrades.shieldBought && lifetimeCrystals >= cost) {
          const newUpgrades = { ...upgrades, shieldBought: true };
          localStorage.setItem('aether_lifetime_crystals', String(lifetimeCrystals - cost));
          localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
          set({
            lifetimeCrystals: lifetimeCrystals - cost,
            upgrades: newUpgrades
          });
        }
      }
    },

    buySkin: (skinId, cost) => {
      const { lifetimeCrystals, upgrades } = get();
      if (upgrades.unlockedSkins.includes(skinId)) return;
      if (lifetimeCrystals >= cost) {
        const newUpgrades = {
          ...upgrades,
          unlockedSkins: [...upgrades.unlockedSkins, skinId],
          equippedSkin: skinId
        };
        localStorage.setItem('aether_lifetime_crystals', String(lifetimeCrystals - cost));
        localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
        set({
          lifetimeCrystals: lifetimeCrystals - cost,
          upgrades: newUpgrades
        });
      }
    },

    equipSkin: (skinId) => {
      const { upgrades } = get();
      if (!upgrades.unlockedSkins.includes(skinId)) return;
      const newUpgrades = { ...upgrades, equippedSkin: skinId };
      localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
      set({ upgrades: newUpgrades });
    },

    clearCompletedMissionNotification: () => {
      set({ recentCompletedMission: null });
    },

    setMenuTab: (tab) => {
      set({ menuTab: tab });
    },

    tick: (dt) => {
      const state = get();
      if (state.gameState !== 'PLAYING') return;

      // 0. Slow-Mo Time Dilation
      const isSlowMo = state.slowMoActiveTime > 0;
      audioManager.setSlowMo(isSlowMo);

      // Temporal Warp Wing passive: 0.45x time dilation factor instead of 0.65x
      const slowMoFactor = state.upgrades.equippedSkin === 'temporal' ? 0.45 : 0.65;
      const physicsDt = dt * (isSlowMo ? slowMoFactor : 1.0);

      // Decays active power-up timers
      let nextMagnetActiveTime = Math.max(0, state.magnetActiveTime - dt);
      let nextSlowMoActiveTime = Math.max(0, state.slowMoActiveTime - dt);
      let nextShieldActive = state.shieldActive;

      // 1. Boost timers & Speed overrides
      let currentSpeed = state.speed;
      let nextBoostActive = state.boostActive;
      let nextBoostTime = state.boostTimeRemaining;
      let nextBoostCharge = state.boostCharge;
      let nextBlastActiveTime = state.blastActiveTime ?? 0;
      let nextTargetX = state.targetX;
      let nextPreBoostSpeed = state.preBoostSpeed;

      let newObstacles = [...state.obstacles];
      let newCrystals = [...state.crystals];
      let newPowerUps = [...state.powerUps];

      if (state.boostActive) {
        nextBoostTime = state.boostTimeRemaining - physicsDt;
        const targetBoostSpeed = state.maxSpeed + 25; // Boost speed is 95 units/s (normal max 70)
        
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

          // SONIC BLAST: Destroy all obstacles in front of player within 80 units
          const blastRangeZ = 80;
          newObstacles = newObstacles.filter((obs) => {
            const zDiff = obs.z - state.playerZ;
            return !(zDiff > 0 && zDiff < blastRangeZ);
          });
          audioManager.playBlastFx();
        }
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
      let currentSector: 1 | 2 | 3 = 1;
      if (newPlayerZ >= 2800) {
        currentSector = 3;
      } else if (newPlayerZ >= 1200) {
        currentSector = 2;
      }

      // Spawning logic: spawn chunk if player approaches lastSpawnedZ
      let nextSpawnZ = state.lastSpawnedZ;
      const spawnHorizon = newPlayerZ + 180; // Spawn 180 units ahead

      while (nextSpawnZ < spawnHorizon) {
        // Choose obstacle pattern
        const patternType = Math.random();
        const shuffledLanes = [...LANES].sort(() => Math.random() - 0.5);
        
        if (patternType < 0.4) {
          // Double lane obstacle (Harder, leaves 1 lane open)
          const blockedLane1 = shuffledLanes[0];
          const blockedLane2 = shuffledLanes[1];
          const freeLane = shuffledLanes[2];

          const obstacleType = Math.random() > 0.5 ? 'WALL' : 'BARRIER';
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

          if (Math.random() > 0.3) {
            newCrystals.push({
              id: `cry-${nextSpawnZ}`,
              x: freeLane,
              z: nextSpawnZ + (Math.random() * 10 - 5),
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

          if (Math.random() > 0.4) {
            newCrystals.push({
              id: `cry-1-${nextSpawnZ}`,
              x: freeLane1,
              z: nextSpawnZ - 5,
              collected: false,
              color: '#ff007f',
            });
          }
          if (Math.random() > 0.4) {
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
          const lane = LANES[Math.floor(Math.random() * LANES.length)];
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

        // Spawn track power-up collectibles with 12% probability
        if (Math.random() < 0.12) {
          const pTypes: ('SHIELD' | 'MAGNET' | 'SLOWMO')[] = ['SHIELD', 'MAGNET', 'SLOWMO'];
          const randomType = pTypes[Math.floor(Math.random() * pTypes.length)];
          const randomLane = LANES[Math.floor(Math.random() * LANES.length)];
          newPowerUps.push({
            id: `pw-${randomType}-${nextSpawnZ}`,
            x: randomLane,
            z: nextSpawnZ + 15,
            type: randomType,
            collected: false,
          });
        }

        nextSpawnZ += SPAWN_INTERVAL;
      }

      // Cleanup elements that the player has passed (behind by more than 15 units)
      newObstacles = newObstacles.filter((o) => o.z > newPlayerZ - 15);
      newCrystals = newCrystals.filter((c) => c.z > newPlayerZ - 15);
      newPowerUps = newPowerUps.filter((pw) => pw.z > newPlayerZ - 15);

      // Update moving obstacles for Sectors 2 and 3 based on their Z coordinate position
      for (const obs of newObstacles) {
        if (obs.z >= 1200 && obs.id.includes('single')) {
          // Slide barriers smoothly between -2.0 and +2.0
          obs.x = Math.sin(obs.z * 0.1 + newPlayerZ * 0.04) * 2.0;
        }
        if (obs.z >= 2800 && obs.type === 'BARRIER') {
          // Pulse the scale/height of barriers in Sector 3
          obs.height = 1.2 + Math.sin(newPlayerZ * 0.08) * 0.4;
        }
      }

      // Perform collision checks inside frame tick
      const shipWidth = 1.0;
      const shipLength = 1.5;
      
      let collisionDetected = false;
      let obstaclesDestroyedThisFrameCount = 0;

      // Check obstacles
      for (const obs of newObstacles) {
        const zDiff = Math.abs(obs.z - newPlayerZ);
        const xDiff = Math.abs(obs.x - state.shipX);
        
        if (zDiff < (shipLength / 2 + 0.6) && xDiff < (obs.width / 2 + shipWidth / 2)) {
          if (nextBoostActive) {
            // Mark obstacle as destroyed by setting its position far behind
            obs.z = -9999;
            obstaclesDestroyedThisFrameCount++;
          } else if (nextShieldActive) {
            // Shield absorbed the collision!
            obs.z = -9999;
            nextShieldActive = false; // Consume shield
            audioManager.playShieldShatterFx();
          } else {
            collisionDetected = true;
            break;
          }
        }
      }

      if (collisionDetected) {
        get().triggerCollision();
        return;
      }

      // Filter out destroyed obstacles
      if (obstaclesDestroyedThisFrameCount > 0) {
        newObstacles = newObstacles.filter(o => o.z > -9000);
      }

      // Calculate magnet radius based on active power-up or permanent upgrade level
      let magnetRadius = 0;
      if (nextMagnetActiveTime > 0) {
        magnetRadius = 6.0;
      } else if (state.upgrades.magnetLevel > 0) {
        const magRadii = [0, 1.5, 2.5, 4.0];
        magnetRadius = magRadii[state.upgrades.magnetLevel];
      }

      // Check crystals
      let crystalsCollectedThisFrame = 0;
      for (const cry of newCrystals) {
        if (cry.collected) continue;

        const zDiff = cry.z - newPlayerZ;
        const xDiff = cry.x - state.shipX;
        const distToShip = Math.sqrt(xDiff * xDiff + zDiff * zDiff);

        if (magnetRadius > 0 && distToShip < magnetRadius && zDiff > 0) {
          // Attract crystals to ship
          const pull = Math.min(1.0, (1.0 - distToShip / magnetRadius) * physicsDt * 8.0);
          cry.x += (state.shipX - cry.x) * pull;
          cry.z += (newPlayerZ - cry.z) * pull * 0.5;
        }

        const finalZDiff = Math.abs(cry.z - newPlayerZ);
        const finalXDiff = Math.abs(cry.x - state.shipX);

        if (finalZDiff < (shipLength / 2 + 0.8) && finalXDiff < (0.8 + shipWidth / 2)) {
          cry.collected = true;
          crystalsCollectedThisFrame++;
          audioManager.playCollectFx();
        }
      }

      // Check power-up item collection
      for (const pw of newPowerUps) {
        if (pw.collected) continue;
        const zDiff = Math.abs(pw.z - newPlayerZ);
        const xDiff = Math.abs(pw.x - state.shipX);

        if (zDiff < (shipLength / 2 + 0.8) && xDiff < (0.8 + shipWidth / 2)) {
          pw.collected = true;
          if (pw.type === 'SHIELD') {
            nextShieldActive = true;
            audioManager.playShieldPickupFx();
          } else if (pw.type === 'MAGNET') {
            nextMagnetActiveTime = 8.0;
            audioManager.playMagnetPickupFx();
          } else if (pw.type === 'SLOWMO') {
            // Temporal Warp Wing passive: 8s slow-mo duration instead of 5s
            nextSlowMoActiveTime = state.upgrades.equippedSkin === 'temporal' ? 8.0 : 5.0;
            audioManager.playSlowMoPickupFx();
          }
        }
      }

      // Vortex Singularity passive: double crystal earnings and boost charge rate
      const hasVortex = state.upgrades.equippedSkin === 'vortex';
      const crystalMultiplier = hasVortex ? 2 : 1;
      const crystalsEarnedThisFrame = crystalsCollectedThisFrame * crystalMultiplier;

      // Accumulate boost charge (max 10) if boost is not currently active
      if (!nextBoostActive && crystalsCollectedThisFrame > 0) {
        nextBoostCharge = Math.min(10, nextBoostCharge + crystalsEarnedThisFrame);
      }

      // Economy update: add collected crystals to lifetime count
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
      let recentSuccess: { id: string, description: string, reward: number } | null = null;
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
        if (completed && !m.completed) {
          recentSuccess = { id: m.id, description: m.description, reward: m.reward };
          audioManager.playMissionSuccessFx();
        }

        return { ...m, current: Math.min(m.target, current), completed };
      });

      if (recentSuccess) {
        nextLifetimeCrystals += (recentSuccess as any).reward;
        localStorage.setItem('aether_lifetime_crystals', String(nextLifetimeCrystals));
        localStorage.setItem('aether_active_missions', JSON.stringify(nextMissions));
      }

      const finalScore = newScore + (crystalsEarnedThisFrame * 500) + (obstaclesDestroyedThisFrameCount * 1000);
      const newCrystalCount = state.crystalCount + crystalsEarnedThisFrame;

      // Quantum Vanguard passive: regenerate shield once per run after Z >= 1500
      let nextQuantumShieldRegenerated = state.quantumShieldRegenerated;
      if (state.upgrades.equippedSkin === 'quantum' && !nextShieldActive && newPlayerZ >= 1500 && !nextQuantumShieldRegenerated) {
        nextShieldActive = true;
        nextQuantumShieldRegenerated = true;
        audioManager.playShieldPickupFx();
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
});
