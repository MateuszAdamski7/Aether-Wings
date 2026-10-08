import type { StateCreator } from 'zustand';
import type { GameStore, SettingsSlice } from './types';
import { audioManager } from '../utils/audio';
import { musicPlayer } from '../utils/musicPlayer';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set, get) => {
  const isCoarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const initialGraphicsQuality: 'HIGH' | 'LOW' = isCoarse ? 'LOW' : 'HIGH';

  return {
    isMuted: false,
    graphicsQuality: initialGraphicsQuality,
    showPerfStats: true,

    toggleMute: () => {
      const newMuted = !get().isMuted;
      audioManager.setMute(newMuted);
      musicPlayer.setMute(newMuted);
      set({ isMuted: newMuted });
    },

    setGraphicsQuality: (quality) => {
      set({ graphicsQuality: quality });
    },

    togglePerfStats: () => {
      set({ showPerfStats: !get().showPerfStats });
    },
  };
};
