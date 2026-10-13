import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_VOLUME } from '../config/tuning';

// Browser APIs the store touches: Web Audio and localStorage (save game)
const audio = vi.hoisted(() => ({ setMute: vi.fn(), setVolume: vi.fn() }));
vi.mock('../utils/audio', () => {
  const manager = new Proxy(audio as Record<string, unknown>, { get: (target, key) => target[key as string] ?? (() => {}) });
  return { audioManager: manager, default: manager };
});

const storage = new Map<string, string>();
vi.stubGlobal('localStorage', {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

type Store = typeof import('./useGameStore').useGameStore;
let useGameStore: Store;

beforeAll(async () => {
  ({ useGameStore } = await import('./useGameStore'));
});

beforeEach(() => {
  useGameStore.setState({ isMuted: false, volume: DEFAULT_VOLUME });
  audio.setMute.mockClear();
  audio.setVolume.mockClear();
});

describe('volume', () => {
  it('stores the volume and applies it to the sound effects', () => {
    useGameStore.getState().setVolume(0.4);

    expect(useGameStore.getState().volume).toBe(0.4);
    expect(audio.setVolume).toHaveBeenLastCalledWith(0.4);
  });

  it('clamps values outside 0 to 1', () => {
    useGameStore.getState().setVolume(1.7);
    expect(useGameStore.getState().volume).toBe(1);

    useGameStore.getState().setVolume(-0.3);
    expect(useGameStore.getState().volume).toBe(0);
  });

  it('unmutes when the slider is raised while muted', () => {
    useGameStore.setState({ isMuted: true });

    useGameStore.getState().setVolume(0.6);

    expect(useGameStore.getState().isMuted).toBe(false);
    expect(audio.setMute).toHaveBeenLastCalledWith(false);
  });

  it('stays muted when the slider is moved to zero', () => {
    useGameStore.setState({ isMuted: true });

    useGameStore.getState().setVolume(0);

    expect(useGameStore.getState().isMuted).toBe(true);
  });

  it('restores the default volume when unmuting with the slider at zero', () => {
    useGameStore.setState({ isMuted: true, volume: 0 });

    useGameStore.getState().toggleMute();

    expect(useGameStore.getState().isMuted).toBe(false);
    expect(useGameStore.getState().volume).toBe(DEFAULT_VOLUME);
  });

  it('keeps the chosen volume across mute and unmute', () => {
    useGameStore.getState().setVolume(0.7);

    useGameStore.getState().toggleMute();
    useGameStore.getState().toggleMute();

    expect(useGameStore.getState().isMuted).toBe(false);
    expect(useGameStore.getState().volume).toBe(0.7);
  });
});
