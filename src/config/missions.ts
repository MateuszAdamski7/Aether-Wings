export interface MissionTemplate {
  type: 'DISTANCE' | 'CRYSTALS' | 'HYPERBOOST' | 'CRUSH_OBSTACLES';
  description: string;
  targets: number[];
  rewardBase: number;
}

export const MISSION_TEMPLATES: MissionTemplate[] = [
  { type: 'DISTANCE', description: 'Travel $targetm in a single run', targets: [1000, 1500, 2000, 2500], rewardBase: 10 },
  { type: 'CRYSTALS', description: 'Collect $target crystals in a single run', targets: [15, 25, 40, 50], rewardBase: 12 },
  { type: 'HYPERBOOST', description: 'Trigger Hyperboost $target times in a single run', targets: [1, 2, 3], rewardBase: 15 },
  { type: 'CRUSH_OBSTACLES', description: 'Smash $target obstacles in Hyperboost', targets: [3, 6, 9], rewardBase: 15 }
];
