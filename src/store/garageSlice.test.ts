import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

// Browser APIs the store touches: Web Audio (purchase sound) and localStorage (save game)
vi.mock('../utils/audio', () => {
  const silent = new Proxy({}, { get: () => () => {} });
  return { audioManager: silent, default: silent };
});

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

type Store = typeof import('./useGameStore').useGameStore;
let useGameStore: Store;
let getWorld: typeof import('../game').getWorld;

beforeAll(async () => {
  ({ useGameStore } = await import('./useGameStore'));
  ({ getWorld } = await import('../game'));
});

beforeEach(async () => {
  const { DEFAULT_UPGRADES } = await import('./garageSlice');
  useGameStore.setState({ lifetimeCrystals: 0, upgrades: DEFAULT_UPGRADES, gameState: 'START' });
});

describe('garage purchases', () => {
  it('buys an affordable upgrade and charges its cost', () => {
    useGameStore.setState({ lifetimeCrystals: 100 });

    useGameStore.getState().buyUpgrade('defense_shield_1');

    const { lifetimeCrystals, upgrades } = useGameStore.getState();
    expect(upgrades.defense_shield_1).toBe(true);
    expect(lifetimeCrystals).toBe(75);
  });

  it('refuses an upgrade whose prerequisite is missing', () => {
    useGameStore.setState({ lifetimeCrystals: 500 });

    useGameStore.getState().buyUpgrade('defense_shield_2');

    expect(useGameStore.getState().upgrades.defense_shield_2).toBe(false);
    expect(useGameStore.getState().lifetimeCrystals).toBe(500);
  });

  it('refuses an upgrade the pilot cannot afford', () => {
    useGameStore.setState({ lifetimeCrystals: 10 });

    useGameStore.getState().buyUpgrade('defense_shield_1');

    expect(useGameStore.getState().upgrades.defense_shield_1).toBe(false);
    expect(useGameStore.getState().lifetimeCrystals).toBe(10);
  });

  it('never charges twice for an owned upgrade', () => {
    useGameStore.setState({ lifetimeCrystals: 100 });

    useGameStore.getState().buyUpgrade('defense_shield_1');
    useGameStore.getState().buyUpgrade('defense_shield_1');

    expect(useGameStore.getState().lifetimeCrystals).toBe(75);
  });

  it('starts the next run with the purchased shield', () => {
    useGameStore.setState({ lifetimeCrystals: 100, sceneReady: true });
    useGameStore.getState().buyUpgrade('defense_shield_1');
    useGameStore.getState().equipSkin('vortex'); // vortex has no shield passive of its own

    useGameStore.getState().startGame();

    expect(useGameStore.getState().gameState).toBe('PLAYING');
    expect(getWorld()?.shield).toMatchObject({ active: true, strength: 1 });
    expect(useGameStore.getState().shieldActive).toBe(true);
  });

  it('saves purchases so they survive a reload', () => {
    useGameStore.setState({ lifetimeCrystals: 100 });

    useGameStore.getState().buyUpgrade('harvest_magnet_1');

    const saved = JSON.parse(storage.get('aether_wings_save') ?? '{}');
    expect(saved.state.upgrades.harvest_magnet_1).toBe(true);
    expect(saved.state.lifetimeCrystals).toBe(80);
  });
});
