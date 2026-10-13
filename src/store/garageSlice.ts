import type { StateCreator } from 'zustand';
import type { GameStore, GarageSlice, GameStoreUpgrades } from './types';
import type { UpgradeId, SkinId } from '../config/gameConfig';
import { NODE_COSTS, PREREQUISITES } from '../config/gameConfig';
import { audioManager } from '../utils/audio';

export const DEFAULT_UPGRADES: GameStoreUpgrades = {
  magnetLevel: 0,
  shieldBought: false,
  unlockedSkins: ['vortex'],
  equippedSkin: 'vortex',
  defense_shield_1: false,
  defense_shield_2: false,
  defense_shield_3: false,
  harvest_magnet_1: false,
  harvest_magnet_2: false,
  harvest_magnet_3: false,
  engine_boost_1: false,
  engine_boost_2: false,
  engine_boost_3: false,
};

export const createGarageSlice: StateCreator<GameStore, [], [], GarageSlice> = (set, get) => ({
  lifetimeCrystals: 0,
  upgrades: DEFAULT_UPGRADES,
  menuTab: 'PLAY',

  buyUpgrade: (nodeId: UpgradeId) => {
    const { lifetimeCrystals, upgrades } = get();
    const cost = NODE_COSTS[nodeId];
    if (!cost) return;

    // Check if already bought
    if (upgrades[nodeId]) return;

    // Check prerequisites
    const prereq = PREREQUISITES[nodeId];
    if (prereq && !upgrades[prereq]) return;

    if (lifetimeCrystals >= cost) {
      const newUpgrades: GameStoreUpgrades = {
        ...upgrades,
        [nodeId]: true,
      };

      audioManager.playShieldPickupFx(); // Satisfying purchase sound

      set({
        lifetimeCrystals: lifetimeCrystals - cost,
        upgrades: newUpgrades,
      });
    }
  },

  buySkin: (skinId: SkinId, cost: number) => {
    const { lifetimeCrystals, upgrades } = get();
    if (upgrades.unlockedSkins.includes(skinId)) return;
    if (lifetimeCrystals >= cost) {
      const newUpgrades: GameStoreUpgrades = {
        ...upgrades,
        unlockedSkins: [...upgrades.unlockedSkins, skinId],
        equippedSkin: skinId,
      };
      set({
        lifetimeCrystals: lifetimeCrystals - cost,
        upgrades: newUpgrades,
      });
    }
  },

  equipSkin: (skinId: SkinId) => {
    const { upgrades } = get();
    if (!upgrades.unlockedSkins.includes(skinId)) return;
    set({
      upgrades: {
        ...upgrades,
        equippedSkin: skinId,
      },
    });
  },

  setMenuTab: (tab) => {
    set({ menuTab: tab });
  },
});
