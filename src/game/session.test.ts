import { afterEach, describe, expect, it } from 'vitest';
import { advanceSession, endSession, renderPlayer, startSession } from './session';
import { FIXED_STEP } from './loop';
import { DEFAULT_RUN_MODIFIERS } from '../config/modifiers';

afterEach(() => endSession());

describe('session render interpolation', () => {
  it('places the rendered ship between the last two fixed steps', () => {
    const world = startSession(DEFAULT_RUN_MODIFIERS, []);

    advanceSession(FIXED_STEP * 2.5);

    const { prevZ, z } = world.player;
    expect(z).toBeGreaterThan(prevZ);
    expect(renderPlayer.z).toBeCloseTo(prevZ + (z - prevZ) * 0.5, 5);
  });

  it('moves the rendered ship forward on every frame at 144 Hz, even when no step runs', () => {
    const world = startSession(DEFAULT_RUN_MODIFIERS, []);
    // Interpolation needs one completed step to blend from; before it the ship is simply at the start
    advanceSession(FIXED_STEP);
    let framesWithoutStep = 0;
    let framesWithoutRenderedMotion = 0;

    for (let frame = 0; frame < 144; frame++) {
      const simulatedBefore = world.player.z;
      const renderedBefore = renderPlayer.z;
      advanceSession(1 / 144);
      if (world.player.z === simulatedBefore) framesWithoutStep++;
      if (renderPlayer.z <= renderedBefore) framesWithoutRenderedMotion++;
    }

    expect(framesWithoutStep).toBeGreaterThan(0); // the stalls interpolation has to hide
    expect(framesWithoutRenderedMotion).toBe(0);
  });

  it('resets the rendered position when the run ends', () => {
    startSession(DEFAULT_RUN_MODIFIERS, []);
    advanceSession(0.5);

    endSession();

    expect(renderPlayer).toEqual({ x: 0, z: 0 });
  });
});
