import type { StateCreator } from 'zustand';
import type { GameStore, MissionSlice } from './types';
import { generateRandomMission } from './missionUtils';

export const createMissionSlice: StateCreator<GameStore, [], [], MissionSlice> = (set) => {
  const savedMissions = localStorage.getItem('aether_active_missions');
  const initialMissions = savedMissions ? JSON.parse(savedMissions) : [
    generateRandomMission(),
    generateRandomMission(),
    generateRandomMission()
  ];

  return {
    activeMissions: initialMissions,
    recentCompletedMission: null,

    clearCompletedMissionNotification: () => {
      set({ recentCompletedMission: null });
    },
  };
};
