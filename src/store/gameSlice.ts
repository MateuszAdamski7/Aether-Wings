import type { StateCreator } from 'zustand';
import type { GameStore, GameSlice, RunHud } from './types';
import { LANES } from '../config/gameConfig';
import { computeRunModifiers } from '../config/modifiers';
import { generateRandomMission } from './missionUtils';
import { audioManager } from '../utils/audio';
import { advanceSession, endSession, gameBus, getWorld, startSession, type World } from '../game';

const BOOST_FULL_CHARGE = 10;
const GAME_OVER_DELAY_MS = 800; // Time to show the crash shake before the game over screen

let isBusSubscribed = false;

function setupEventBus(
  get: () => GameStore,
  set: (state: Partial<GameStore> | ((s: GameStore) => Partial<GameStore>)) => void
) {
  if (isBusSubscribed) return;
  isBusSubscribed = true;

  gameBus.on('crash', () => {
    get().triggerCollision();
  });
  gameBus.on('crystalCollected', (data) => {
    audioManager.playCollectFx();
    set((s) => ({ lifetimeCrystals: s.lifetimeCrystals + data.earned }));
  });
  gameBus.on('powerupCollected', (data) => {
    if (data.type === 'SHIELD') {
      audioManager.playShieldPickupFx();
    } else {
      audioManager.playMagnetPickupFx();
    }
  });
  gameBus.on('shieldAbsorbed', () => {
    audioManager.playShieldShatterFx();
  });
  gameBus.on('shieldRegenerated', () => {
    audioManager.playShieldPickupFx();
  });
  gameBus.on('blastFired', () => {
    audioManager.playBlastFx();
  });
  gameBus.on('missionCompleted', (data) => {
    audioManager.playMissionSuccessFx();
    set((s) => ({
      recentCompletedMission: data,
      lifetimeCrystals: s.lifetimeCrystals + data.reward,
    }));
  });
}

const EMPTY_RUN_HUD: RunHud = {
  crystalCount: 0,
  boostCharge: 0,
  boostActive: false,
  shieldActive: false,
  shieldStrength: 0,
  magnetActive: false,
  shieldRecharging: false,
  currentSector: 1,
};

function selectRunHud(world: World): RunHud {
  return {
    crystalCount: world.crystalCount,
    boostCharge: Math.floor(world.timers.boostCharge),
    boostActive: world.timers.boostRemaining > 0,
    shieldActive: world.shield.active,
    shieldStrength: world.shield.strength,
    magnetActive: world.timers.magnetActive > 0,
    shieldRecharging: world.modifiers.hasShieldRegen && !world.shield.active && world.timers.shieldRegen > 0,
    currentSector: world.currentSector,
  };
}

function hasRunHudChanged(state: GameStore, hud: RunHud): boolean {
  for (const key of Object.keys(hud) as (keyof RunHud)[]) {
    if (state[key] !== hud[key]) return true;
  }
  return false;
}

/** The active run, but only while it accepts player input */
function getControllableWorld(get: () => GameStore): World | null {
  const world = getWorld();
  const { gameState, collisionTriggered } = get();
  if (!world || gameState !== 'PLAYING' || collisionTriggered) return null;
  return world;
}

export const createGameSlice: StateCreator<GameStore, [], [], GameSlice> = (set, get) => {
  return {
    ...EMPTY_RUN_HUD,
    gameState: 'START',
    score: 0,
    distance: 0,
    highScore: 0,
    collisionTriggered: false,
    sceneReady: false,

    setSceneReady: () => set({ sceneReady: true }),

    startGame: () => {
      if (!get().sceneReady) return; // Nothing would tick or render the run yet
      const { upgrades } = get();
      setupEventBus(get, set);

      const runModifiers = computeRunModifiers(upgrades, upgrades.equippedSkin);
      const world = startSession(runModifiers, get().activeMissions);

      set({
        ...selectRunHud(world),
        gameState: 'PLAYING',
        score: 0,
        distance: 0,
        collisionTriggered: false,
        activeMissions: world.activeMissions,
        recentCompletedMission: null,
      });
    },

    resetGame: () => {
      // Regenerate completed missions
      const finalMissions = get().activeMissions.map((m) => {
        if (m.completed) {
          return generateRandomMission();
        }
        return m;
      });

      endSession();

      set({
        ...EMPTY_RUN_HUD,
        gameState: 'START',
        score: 0,
        distance: 0,
        collisionTriggered: false,
        activeMissions: finalMissions,
        recentCompletedMission: null,
      });
    },

    setGameState: (state) => set({ gameState: state }),

    // Simulation, input and boost all guard on gameState === 'PLAYING', so PAUSED freezes the run
    pauseGame: () => {
      const { gameState, collisionTriggered } = get();
      if (gameState !== 'PLAYING' || collisionTriggered) return;
      set({ gameState: 'PAUSED' });
    },

    resumeGame: () => {
      if (get().gameState !== 'PAUSED') return;
      set({ gameState: 'PLAYING' });
    },

    quitToMenu: () => {
      if (get().gameState !== 'PAUSED') return;
      get().saveProgress();
      get().resetGame();
    },

    shiftLane: (screenDirection) => {
      const world = getControllableWorld(get);
      if (!world || world.timers.boostRemaining > 0) return;

      // Find the closest discrete lane index
      let closestLaneIndex = 0;
      let minDistance = Infinity;
      for (let i = 0; i < LANES.length; i++) {
        const dist = Math.abs(LANES[i] - world.player.targetX);
        if (dist < minDistance) {
          minDistance = dist;
          closestLaneIndex = i;
        }
      }

      // The chase camera looks down +Z, so world X is mirrored on screen: screen-right = lower lane index
      const nextIndex = Math.max(0, Math.min(LANES.length - 1, closestLaneIndex - screenDirection));
      world.player.targetX = LANES[nextIndex];
    },

    saveProgress: () => {
      const score = getWorld()?.score ?? get().score;
      if (score > get().highScore) {
        set({ highScore: score });
      }
    },

    triggerCollision: () => {
      if (get().collisionTriggered) return;

      const world = getWorld();
      if (world) {
        world.collisionTriggered = true;
        world.player.speed = 0;
        world.timers.boostRemaining = 0;
      }

      audioManager.playCrashFx();
      set({ collisionTriggered: true, boostActive: false });

      // After screen shake/glitch effect, trigger game over and persist run progress
      setTimeout(() => {
        const finishedRun = getWorld();
        get().saveProgress();
        set({
          gameState: 'GAME_OVER',
          score: finishedRun?.score ?? 0,
          distance: finishedRun?.distance ?? 0,
        });
      }, GAME_OVER_DELAY_MS);
    },

    activateBoost: () => {
      const world = getControllableWorld(get);
      if (!world || world.timers.boostRemaining > 0 || world.timers.boostCharge < BOOST_FULL_CHARGE) return;

      audioManager.playBoostFx();
      world.timers.boostRemaining = world.modifiers.boostDuration;
      world.player.preBoostSpeed = world.player.speed;
      world.player.targetX = 0; // snap to center
      world.runStats.boostsTriggered += 1;
      set({ boostActive: true });
    },

    tick: (dt) => {
      if (get().gameState !== 'PLAYING' || get().collisionTriggered) return;
      const world = getWorld();
      if (!world) return;

      advanceSession(dt);
      if (get().collisionTriggered) return;

      // Notify React only when a discrete UI value actually changed
      const hud = selectRunHud(world);
      if (hasRunHudChanged(get(), hud)) set(hud);
    },
  };
};
