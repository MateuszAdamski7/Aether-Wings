import type { StateCreator } from 'zustand';
import type { GameStore, SettingsSlice } from './types';
import { audioManager } from '../utils/audio';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set, get) => {
  // Load sound setting
  const savedMute = localStorage.getItem('aether_muted');
  const initialMute = savedMute ? savedMute === 'true' : false;

  // Set initial audio manager mute state
  audioManager.setMute(initialMute);

  const savedGraphicsQuality = localStorage.getItem('aether_graphics_quality');
  const initialGraphicsQuality = (savedGraphicsQuality === 'LOW') ? 'LOW' : 'HIGH';

  return {
    isMuted: initialMute,
    graphicsQuality: initialGraphicsQuality,

    toggleMute: () => {
      const newMuted = !get().isMuted;
      localStorage.setItem('aether_muted', String(newMuted));
      audioManager.setMute(newMuted);
      set({ isMuted: newMuted });
    },

    setGraphicsQuality: (quality) => {
      localStorage.setItem('aether_graphics_quality', quality);
      set({ graphicsQuality: quality });
    },
  };
};
