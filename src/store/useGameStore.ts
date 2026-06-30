import { create } from 'zustand';
import type { GameStore } from './types';
import { createGameSlice } from './gameSlice';
import { createGarageSlice } from './garageSlice';
import { createSettingsSlice } from './settingsSlice';
import { createMissionSlice } from './missionSlice';

export * from './types';
export { generateRandomMission } from './missionUtils';

export const useGameStore = create<GameStore>((set, get, store) => ({
  ...createGameSlice(set, get, store),
  ...createGarageSlice(set, get, store),
  ...createSettingsSlice(set, get, store),
  ...createMissionSlice(set, get, store),
}));
