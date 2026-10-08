import { create } from 'zustand';
import { persist, createJSONStorage, type PersistStorage } from 'zustand/middleware';
import { shallow } from 'zustand/shallow';
import type { GameStore } from './types';
import { createGameSlice } from './gameSlice';
import { createGarageSlice } from './garageSlice';
import { createSettingsSlice } from './settingsSlice';
import { createMissionSlice } from './missionSlice';
import { audioManager } from '../utils/audio';
import { musicPlayer } from '../utils/musicPlayer';

export * from './types';
export { generateRandomMission } from './missionUtils';

type PersistedState = Pick<
  GameStore,
  'highScore' | 'lifetimeCrystals' | 'upgrades' | 'activeMissions' | 'isMuted' | 'graphicsQuality' | 'showPerfStats'
>;

/**
 * persist middleware writes on every set(), and tick() calls set() every frame.
 * Skip the synchronous localStorage write when the persisted fields are unchanged.
 */
function createDedupedStorage(): PersistStorage<PersistedState> | undefined {
  const baseStorage = createJSONStorage<PersistedState>(() => localStorage);
  if (!baseStorage) return undefined;

  let lastSaved: PersistedState | null = null;

  return {
    getItem: (name) => {
      const value = baseStorage.getItem(name);
      if (value && !(value instanceof Promise)) lastSaved = value.state;
      return value;
    },
    setItem: (name, value) => {
      if (lastSaved && shallow(lastSaved, value.state)) return;
      lastSaved = value.state;
      try {
        baseStorage.setItem(name, value);
      } catch (err) {
        console.error('[persist] Failed to save progress:', err);
      }
    },
    removeItem: (name) => {
      lastSaved = null;
      baseStorage.removeItem(name);
    },
  };
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get, store) => ({
      ...createGameSlice(set, get, store),
      ...createGarageSlice(set, get, store),
      ...createSettingsSlice(set, get, store),
      ...createMissionSlice(set, get, store),
    }),
    {
      name: 'aether_wings_save',
      storage: createDedupedStorage(),
      partialize: (state): PersistedState => ({
        highScore: state.highScore,
        lifetimeCrystals: state.lifetimeCrystals,
        upgrades: state.upgrades,
        activeMissions: state.activeMissions,
        isMuted: state.isMuted,
        graphicsQuality: state.graphicsQuality,
        showPerfStats: state.showPerfStats,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          audioManager.setMute(state.isMuted);
          musicPlayer.setMute(state.isMuted);
        }
      },
    }
  )
);
