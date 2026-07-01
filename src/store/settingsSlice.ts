import type { StateCreator } from 'zustand';
import type { GameStore, SettingsSlice } from './types';
import { audioManager } from '../utils/audio';

export const createSettingsSlice: StateCreator<GameStore, [], [], SettingsSlice> = (set, get) => {
  // Load sound setting
  const savedMute = localStorage.getItem('aether_muted');
  const initialMute = savedMute ? savedMute === 'true' : false;

  const savedVolume = localStorage.getItem('aether_volume');
  const initialVolume = savedVolume ? parseFloat(savedVolume) : 0.8;

  // Set initial audio manager state
  audioManager.setMute(initialMute);
  audioManager.setVolume(initialVolume);

  const savedGraphicsQuality = localStorage.getItem('aether_graphics_quality');
  const initialGraphicsQuality = (savedGraphicsQuality === 'LOW') ? 'LOW' : 'HIGH';

  return {
    isMuted: initialMute,
    volume: initialVolume,
    graphicsQuality: initialGraphicsQuality,

    toggleMute: () => {
      const newMuted = !get().isMuted;
      localStorage.setItem('aether_muted', String(newMuted));
      audioManager.setMute(newMuted);
      set({ isMuted: newMuted });
    },

    setVolume: (volume) => {
      localStorage.setItem('aether_volume', String(volume));
      audioManager.setVolume(volume);
      
      const updates: Partial<SettingsSlice> = { volume };
      
      // Auto mute/unmute logic for a better UX
      if (volume > 0 && get().isMuted) {
        localStorage.setItem('aether_muted', 'false');
        audioManager.setMute(false);
        updates.isMuted = false;
      } else if (volume === 0 && !get().isMuted) {
        localStorage.setItem('aether_muted', 'true');
        audioManager.setMute(true);
        updates.isMuted = true;
      }
      
      set(updates);
    },

    setGraphicsQuality: (quality) => {
      localStorage.setItem('aether_graphics_quality', quality);
      set({ graphicsQuality: quality });
    },
  };
};
