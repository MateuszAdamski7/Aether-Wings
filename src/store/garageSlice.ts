import type { StateCreator } from 'zustand';
import type { GameStore, GarageSlice } from './types';
import { NODE_COSTS, PREREQUISITES } from '../config/gameConfig';
import { audioManager } from '../utils/audio';

export const createGarageSlice: StateCreator<GameStore, [], [], GarageSlice> = (set, get) => {
  // Load lifetime crystals and upgrades
  const savedCrystals = localStorage.getItem('aether_lifetime_crystals');
  const initialLifetimeCrystals = savedCrystals ? parseInt(savedCrystals, 10) : 0;

  const savedUpgrades = localStorage.getItem('aether_upgrades');
  const defaultUpgrades = {
    magnetLevel: 0,
    shieldBought: false,
    unlockedSkins: ['pink'],
    equippedSkin: 'pink',
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

  let initialUpgrades = defaultUpgrades;
  if (savedUpgrades) {
    try {
      const parsed = JSON.parse(savedUpgrades);
      // Migrate old upgrades to new tech tree
      if (parsed.magnetLevel >= 1) parsed.harvest_magnet_1 = true;
      if (parsed.magnetLevel >= 2) parsed.harvest_magnet_2 = true;
      if (parsed.magnetLevel >= 3) parsed.harvest_magnet_3 = true;
      if (parsed.shieldBought) parsed.defense_shield_1 = true;
      
      initialUpgrades = { ...defaultUpgrades, ...parsed };
    } catch (e) {
      console.error("Failed to parse saved upgrades", e);
    }
  }

  return {
    lifetimeCrystals: initialLifetimeCrystals,
    upgrades: initialUpgrades,
    menuTab: 'PLAY',

    buyUpgrade: (nodeId) => {
      const { lifetimeCrystals, upgrades } = get();
      const cost = NODE_COSTS[nodeId];
      if (!cost) return;

      // Check if already bought
      if (upgrades[nodeId as keyof typeof upgrades]) return;

      // Check prerequisites
      const prereq = PREREQUISITES[nodeId];
      if (prereq && !upgrades[prereq as keyof typeof upgrades]) return;

      if (lifetimeCrystals >= cost) {
        const newUpgrades = {
          ...upgrades,
          [nodeId]: true
        };
        localStorage.setItem('aether_lifetime_crystals', String(lifetimeCrystals - cost));
        localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
        
        audioManager.playShieldPickupFx(); // Satisfying purchase sound

        set({
          lifetimeCrystals: lifetimeCrystals - cost,
          upgrades: newUpgrades
        });
      }
    },

    buySkin: (skinId, cost) => {
      const { lifetimeCrystals, upgrades } = get();
      if (upgrades.unlockedSkins.includes(skinId)) return;
      if (lifetimeCrystals >= cost) {
        const newUpgrades = {
          ...upgrades,
          unlockedSkins: [...upgrades.unlockedSkins, skinId],
          equippedSkin: skinId
        };
        localStorage.setItem('aether_lifetime_crystals', String(lifetimeCrystals - cost));
        localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
        set({
          lifetimeCrystals: lifetimeCrystals - cost,
          upgrades: newUpgrades
        });
      }
    },

    equipSkin: (skinId) => {
      const { upgrades } = get();
      if (!upgrades.unlockedSkins.includes(skinId)) return;
      const newUpgrades = { ...upgrades, equippedSkin: skinId };
      localStorage.setItem('aether_upgrades', JSON.stringify(newUpgrades));
      set({ upgrades: newUpgrades });
    },

    setMenuTab: (tab) => {
      set({ menuTab: tab });
    },
  };
};
