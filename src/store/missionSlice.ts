import type { StateCreator } from 'zustand';
import type { GameStore, MissionSlice } from './types';
import { generateRandomMission } from './missionUtils';

export const createMissionSlice: StateCreator<GameStore, [], [], MissionSlice> = (set) => {
  return {
    activeMissions: [
      generateRandomMission(),
      generateRandomMission(),
      generateRandomMission()
    ],
    recentCompletedMission: null,

    clearCompletedMissionNotification: () => {
      set({ recentCompletedMission: null });
    },
  };
};
