import { describe, expect, it } from 'vitest';
import { missionSystem } from './missionSystem';
import { makeWorld, recordingBus } from '../testing';
import type { Mission } from '../../store/types';

const mission = (fields: Partial<Mission>): Mission => ({
  id: 'm1',
  type: 'DISTANCE',
  description: 'Travel 100m',
  target: 100,
  current: 0,
  reward: 10,
  completed: false,
  ...fields,
});

describe('missionSystem', () => {
  it('tracks progress toward a mission target', () => {
    const world = makeWorld();
    world.activeMissions = [mission({ type: 'DISTANCE', target: 100 })];
    world.distance = 42.7;

    missionSystem(world, recordingBus().bus);

    expect(world.activeMissions[0]).toMatchObject({ current: 42, completed: false });
  });

  it('completes a mission exactly once and reports the reward', () => {
    const world = makeWorld();
    world.activeMissions = [mission({ type: 'CRYSTALS', target: 5, reward: 12 })];
    world.runStats.crystalsCollected = 7;
    const { bus, events } = recordingBus();

    missionSystem(world, bus);
    missionSystem(world, bus);

    expect(world.activeMissions[0]).toMatchObject({ current: 5, completed: true });
    expect(events).toEqual([
      { type: 'missionCompleted', data: { id: 'm1', description: 'Travel 100m', reward: 12 } },
    ]);
  });

  it('counts each mission type from its own statistic', () => {
    const world = makeWorld();
    world.activeMissions = [
      mission({ id: 'boost', type: 'HYPERBOOST', target: 3 }),
      mission({ id: 'crush', type: 'CRUSH_OBSTACLES', target: 9 }),
    ];
    world.runStats.boostsTriggered = 2;
    world.runStats.obstaclesCrushed = 4;

    missionSystem(world, recordingBus().bus);

    expect(world.activeMissions.map((m) => m.current)).toEqual([2, 4]);
  });
});
