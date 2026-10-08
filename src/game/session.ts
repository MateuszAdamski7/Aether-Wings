import type { World } from './types';
import type { RunModifiers } from '../config/modifiers';
import type { Mission } from '../store/types';
import { createWorld } from './world';
import { FixedSimulationLoop } from './loop';
import { GameEventBus } from './events';

/**
 * The single source of truth for a run in progress.
 * The store drives it (start/advance/end) and mirrors only UI-relevant values;
 * render code reads the world directly every frame via getWorld().
 */
let world: World | null = null;
const loop = new FixedSimulationLoop();

export const gameBus = new GameEventBus();

/**
 * Player position for rendering, blended between the last two fixed steps by how far the loop is
 * into the next one. Without it, frames that run 0 or 2 steps (common at 120/144 Hz) make the scene
 * stop and jump. Read this (not world.player) for anything the camera follows.
 */
export const renderPlayer = { x: 0, z: 0 };

function syncRenderPlayer(): void {
  if (!world) {
    renderPlayer.x = 0;
    renderPlayer.z = 0;
    return;
  }
  const { prevX, x, prevZ, z } = world.player;
  const alpha = loop.alpha;
  renderPlayer.x = prevX + (x - prevX) * alpha;
  renderPlayer.z = prevZ + (z - prevZ) * alpha;
}

export function startSession(modifiers: RunModifiers, missions: Mission[]): World {
  world = createWorld(modifiers, missions);
  loop.reset();
  // Seed the initial track spawn
  loop.advance(world, 0, gameBus);
  syncRenderPlayer();
  return world;
}

export function advanceSession(dt: number): void {
  if (!world) return;
  loop.advance(world, dt, gameBus);
  syncRenderPlayer();
}

export function endSession(): void {
  world = null;
  loop.reset();
  syncRenderPlayer();
}

/** Current run, or null in the main menu */
export function getWorld(): World | null {
  return world;
}
