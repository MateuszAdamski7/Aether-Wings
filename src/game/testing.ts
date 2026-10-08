import { createWorld } from './world';
import { GameEventBus } from './events';
import { DEFAULT_RUN_MODIFIERS, type RunModifiers } from '../config/modifiers';
import type { GameEventMap, World } from './types';
import type { Crystal, Obstacle, PowerUp } from '../store/types';

/** Test helpers for the simulation. Not imported by the app. */

/** A world with procedural spawning disabled, so tests place track objects explicitly */
export function makeWorld(modifiers: Partial<RunModifiers> = {}, seed = 1): World {
  const world = createWorld({ ...DEFAULT_RUN_MODIFIERS, ...modifiers }, [], seed);
  world.lastSpawnedZ = Number.POSITIVE_INFINITY;
  return world;
}

/** Puts the ship at a fixed spot (no movement within the step under test) */
export function placePlayer(world: World, x: number, z: number): void {
  world.player.x = x;
  world.player.prevX = x;
  world.player.targetX = x;
  world.player.z = z;
  world.player.prevZ = z;
}

let nextId = 0;

export function obstacle(fields: Partial<Obstacle> = {}): Obstacle {
  return { id: `test-obs-${nextId++}`, x: 0, z: 0, width: 1.5, height: 2, type: 'BARRIER', ...fields };
}

export function crystal(fields: Partial<Crystal> = {}): Crystal {
  return { id: `test-cry-${nextId++}`, x: 0, z: 0, collected: false, color: '#00f3ff', ...fields };
}

export function powerUp(fields: Partial<PowerUp> = {}): PowerUp {
  return { id: `test-pw-${nextId++}`, x: 0, z: 0, type: 'SHIELD', collected: false, ...fields };
}

const ALL_EVENTS: (keyof GameEventMap)[] = [
  'crash',
  'crystalCollected',
  'powerupCollected',
  'shieldAbsorbed',
  'shieldRegenerated',
  'blastFired',
  'boostActivated',
  'boostEnded',
  'missionCompleted',
];

export interface RecordedEvent {
  type: keyof GameEventMap;
  data: unknown;
}

/** A bus that records every emitted event in order */
export function recordingBus(): { bus: GameEventBus; events: RecordedEvent[] } {
  const bus = new GameEventBus();
  const events: RecordedEvent[] = [];
  for (const type of ALL_EVENTS) {
    bus.on(type, (data) => events.push({ type, data }));
  }
  return { bus, events };
}
