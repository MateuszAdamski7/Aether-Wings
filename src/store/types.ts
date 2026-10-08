import type { UpgradeId, SkinId } from '../config/gameConfig';

export type GameState = 'START' | 'PLAYING' | 'PAUSED' | 'GAME_OVER';

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
  /** Caught by a magnet: homes in on the ship until collected */
  magnetized?: boolean;
}

export interface PowerUp {
  id: string;
  x: number;
  z: number;
  type: 'SHIELD' | 'MAGNET';
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

export interface GameStoreUpgrades {
  magnetLevel: number;
  shieldBought: boolean;
  unlockedSkins: SkinId[];
  equippedSkin: SkinId;
  defense_shield_1: boolean;
  defense_shield_2: boolean;
  defense_shield_3: boolean;
  harvest_magnet_1: boolean;
  harvest_magnet_2: boolean;
  harvest_magnet_3: boolean;
  engine_boost_1: boolean;
  engine_boost_2: boolean;
  engine_boost_3: boolean;
}

export interface RunStats {
  crystalsCollected: number;
  boostsTriggered: number;
  obstaclesCrushed: number;
}

/**
 * Discrete run values mirrored from the World for React UI.
 * Updated only when one of them changes; continuous values (position, speed, timers)
 * are read from the World directly (see game/session getWorld()).
 */
export interface RunHud {
  crystalCount: number;
  /** Whole charge units, 0 to 10 */
  boostCharge: number;
  boostActive: boolean;
  shieldActive: boolean;
  shieldStrength: number;
  magnetActive: boolean;
  shieldRecharging: boolean;
  currentSector: 1 | 2 | 3;
}

export interface GameSlice extends RunHud {
  gameState: GameState;
  /** Final results of the last finished run (live values are in the World) */
  score: number;
  distance: number;
  highScore: number;
  collisionTriggered: boolean;
  /** The lazily loaded 3D scene has mounted; the game loop runs inside it */
  sceneReady: boolean;

  // Actions
  startGame: () => void;
  setSceneReady: () => void;
  resetGame: () => void;
  setGameState: (state: GameState) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  quitToMenu: () => void;
  /** Shift one lane in screen space: -1 = left, 1 = right */
  shiftLane: (screenDirection: -1 | 1) => void;
  triggerCollision: () => void;
  activateBoost: () => void;
  tick: (dt: number) => void;
  saveProgress: () => void;
}

export interface GarageSlice {
  lifetimeCrystals: number;
  upgrades: GameStoreUpgrades;
  menuTab: 'PLAY' | 'GARAGE' | 'MISSIONS';

  buyUpgrade: (nodeId: UpgradeId) => void;
  buySkin: (skinId: SkinId, cost: number) => void;
  equipSkin: (skinId: SkinId) => void;
  setMenuTab: (tab: 'PLAY' | 'GARAGE' | 'MISSIONS') => void;
}

export interface SettingsSlice {
  isMuted: boolean;
  graphicsQuality: 'HIGH' | 'LOW';
  showPerfStats: boolean;

  toggleMute: () => void;
  setGraphicsQuality: (quality: 'HIGH' | 'LOW') => void;
  togglePerfStats: () => void;
}

export interface MissionSlice {
  activeMissions: Mission[];
  recentCompletedMission: { id: string; description: string; reward: number } | null;

  clearCompletedMissionNotification: () => void;
}

export interface GameStore extends GameSlice, GarageSlice, SettingsSlice, MissionSlice {}
export type GameStoreCreator<T> = (
  set: (state: Partial<GameStore> | ((state: GameStore) => Partial<GameStore>)) => void,
  get: () => GameStore
) => T;
