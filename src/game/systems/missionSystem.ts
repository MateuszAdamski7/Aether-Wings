import type { World } from '../types';
import type { GameEventBus } from '../events';

export function missionSystem(world: World, bus: GameEventBus): void {
  for (const m of world.activeMissions) {
    if (m.completed) continue;

    let current = m.current;
    if (m.type === 'DISTANCE') {
      current = Math.floor(world.distance);
    } else if (m.type === 'CRYSTALS') {
      current = world.runStats.crystalsCollected;
    } else if (m.type === 'HYPERBOOST') {
      current = world.runStats.boostsTriggered;
    } else if (m.type === 'CRUSH_OBSTACLES') {
      current = world.runStats.obstaclesCrushed;
    }

    m.current = Math.min(m.target, current);
    if (m.current >= m.target) {
      m.completed = true;
      bus.emit('missionCompleted', {
        id: m.id,
        description: m.description,
        reward: m.reward,
      });
    }
  }
}
