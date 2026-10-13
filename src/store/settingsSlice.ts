import type { StateCreator } from 'zustand';
import type { GameStore, SettingsSlice } from './types';
import { audioManager } from '../utils/audio';
import { musicPlayer } from '../utils/musicPlayer';
import { DEFAULT_VOLUME } from '../config/tuning';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set, get) => {
  const isCoarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;
  const initialGraphicsQuality: 'HIGH' | 'LOW' = isCoarse ? 'LOW' : 'HIGH';

  return {
    isMuted: false,
    volume: DEFAULT_VOLUME,
    graphicsQuality: initialGraphicsQuality,

    toggleMute: () => {
      const newMuted = !get().isMuted;
      audioManager.setMute(newMuted);
      musicPlayer.setMute(newMuted);
      set({ isMuted: newMuted });
      // Unmuting with the slider at zero would still be silent
      if (!newMuted && get().volume === 0) get().setVolume(DEFAULT_VOLUME);
    },

    setVolume: (volume) => {
      const clamped = Math.min(1, Math.max(0, volume));
      audioManager.setVolume(clamped);
      musicPlayer.setVolume(clamped);
      set({ volume: clamped });
      // Raising the slider while muted means the player wants to hear it
      if (clamped > 0 && get().isMuted) get().toggleMute();
    },

    setGraphicsQuality: (quality) => {
      set({ graphicsQuality: quality });
    },
  };
};
