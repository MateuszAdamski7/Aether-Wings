import type { Mission, RunStats } from './types';
import { MISSION_TEMPLATES } from '../config/gameConfig';

export function generateRandomMission(): Mission {
  const template = MISSION_TEMPLATES[Math.floor(Math.random() * MISSION_TEMPLATES.length)];
  const targetIndex = Math.floor(Math.random() * template.targets.length);
  const target = template.targets[targetIndex];
  const reward = template.rewardBase + targetIndex * 5;
  const description = template.description.replace('$target', String(target));
  return {
    id: `mission-${Math.random().toString(36).substr(2, 9)}`,
    type: template.type,
    description,
    target,
    current: 0,
    reward,
    completed: false,
  };
}

export interface MissionProgressResult {
  nextMissions: Mission[];
  newlyCompletedMission: Mission | null;
}

export function updateMissionProgress(
  activeMissions: Mission[],
  newDistance: number,
  newRunStats: RunStats
): MissionProgressResult {
  const nextMissions = activeMissions.map((m) => {
    if (m.completed) return m;

    let current = m.current;
    if (m.type === 'DISTANCE') {
      current = Math.floor(newDistance);
    } else if (m.type === 'CRYSTALS') {
      current = newRunStats.crystalsCollected;
    } else if (m.type === 'HYPERBOOST') {
      current = newRunStats.boostsTriggered;
    } else if (m.type === 'CRUSH_OBSTACLES') {
      current = newRunStats.obstaclesCrushed;
    }

    const completed = current >= m.target;
    return { ...m, current: Math.min(m.target, current), completed };
  });

  const newlyCompletedMission = nextMissions.find(
    (m, idx) => m.completed && !activeMissions[idx].completed
  ) || null;

  return {
    nextMissions,
    newlyCompletedMission,
  };
}
