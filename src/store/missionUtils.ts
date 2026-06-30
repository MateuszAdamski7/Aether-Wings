import type { Mission } from './types';
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
