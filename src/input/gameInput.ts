import { attachSwipeInput, type SwipeDirection } from './touchInput';

/**
 * Translates raw keyboard and touch events into game actions.
 * Directions are in screen space; mapping to world X happens in the store.
 */
export interface GameInputActions {
  shiftLane: (screenDirection: SwipeDirection) => void;
  boost: () => void;
  pause: () => void;
  togglePerfStats: () => void;
}

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const PAUSE_KEYS = new Set(['Escape', 'p', 'P']);
const PERF_STATS_KEYS = new Set(['F3', '`']);

function attachKeyboardInput(actions: GameInputActions): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (LEFT_KEYS.has(e.key)) {
      actions.shiftLane(-1);
    } else if (RIGHT_KEYS.has(e.key)) {
      actions.shiftLane(1);
    } else if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll
      actions.boost();
    } else if (PERF_STATS_KEYS.has(e.key)) {
      e.preventDefault();
      actions.togglePerfStats();
    } else if (PAUSE_KEYS.has(e.key)) {
      // Resuming from PAUSED is handled by PauseMenu (it runs the countdown)
      actions.pause();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}

export function attachGameInput(actions: GameInputActions): () => void {
  const detachers = [
    attachKeyboardInput(actions),
    attachSwipeInput(actions.shiftLane),
  ];
  return () => detachers.forEach((detach) => detach());
}
