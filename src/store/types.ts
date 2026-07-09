export type GameState = 'START' | 'PLAYING' | 'GAME_OVER';

export interface Obstacle {
  id: string;
  x: number; // lane position (-2, 0, 2)
  z: number; // Z distance
  width: number;
  height: number;
  type: 'WALL' | 'BARRIER' | 'ARCH';
  destroyed?: boolean;
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

export interface GameStoreUpgrades {
  magnetLevel: number;
  shieldBought: boolean;
  unlockedSkins: string[];
  equippedSkin: string;
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

export interface GameSlice {
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

  // Active states
  shieldActive: boolean;
  shieldStrength: number;
  shieldRegenTimer: number;
  quantumShieldRegenerated: boolean;
  magnetActiveTime: number;
  slowMoActiveTime: number;
  currentSector: number;
  runStats: RunStats;

  // Actions
  startGame: () => void;
  resetGame: () => void;
  setGameState: (state: GameState) => void;
  moveLeft: () => void;
  moveRight: () => void;
  setMouseX: (x: number) => void;
  setShipX: (x: number) => void;
  collectCrystal: (id: string) => void;
  triggerCollision: () => void;
  activateBoost: () => void;
  tick: (dt: number) => void;
}

export interface ShipModifier {
  id: string;
  name: string;
  // Lifecycle hooks
  onStartGame?: (state: GameStore, set: (state: Partial<GameStore>) => void) => void;
  onTick?: (dt: number, state: GameStore, set: (state: Partial<GameStore>) => void) => void;

  // Parameter modifiers
  modifyMagnetRadius?: (radius: number, isPowerUpActive: boolean) => number;
  modifyMagnetPowerUpDuration?: (duration: number) => number;
  modifyShieldPowerUpCapacity?: (capacity: number) => number;
  modifyBoostDuration?: (duration: number) => number;
  modifyExtraBoostSpeed?: (speed: number) => number;
  modifySlowMoPowerUpDuration?: (duration: number) => number;
  modifyBoostChargeRate?: (rate: number) => number;
  modifySlowMoFactor?: (factor: number) => number;
  modifyCrystalMultiplier?: (multiplier: number) => number;
}

export interface GarageSlice {
  lifetimeCrystals: number;
  upgrades: GameStoreUpgrades;
  activeModifiers: ShipModifier[];
  menuTab: 'PLAY' | 'GARAGE' | 'MISSIONS';

  buyUpgrade: (nodeId: string) => void;
  buySkin: (skinId: string, cost: number) => void;
  equipSkin: (skinId: string) => void;
  setMenuTab: (tab: 'PLAY' | 'GARAGE' | 'MISSIONS') => void;
}

export interface SettingsSlice {
  isMuted: boolean;
  volume: number;
  graphicsQuality: 'HIGH' | 'LOW';

  toggleMute: () => void;
  setVolume: (volume: number) => void;
  setGraphicsQuality: (quality: 'HIGH' | 'LOW') => void;
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
