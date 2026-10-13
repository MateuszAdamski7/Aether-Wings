import { attachSwipeInput, type SwipeDirection } from './touchInput';

/**
 * Translates raw keyboard and touch events into game actions.
 * Directions are in screen space; mapping to world X happens in the store.
 */
export interface GameInputActions {
  shiftLane: (screenDirection: SwipeDirection) => void;
  boost: () => void;
  pause: () => void;
}

const LEFT_KEYS = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT_KEYS = new Set(['ArrowRight', 'd', 'D']);
const PAUSE_KEYS = new Set(['Escape', 'p', 'P']);

function attachKeyboardInput(actions: GameInputActions): () => void {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Keys pressed on a form control (arrows on the volume slider) belong to it; only pause still goes through
    if (e.target instanceof HTMLInputElement && !PAUSE_KEYS.has(e.key)) return;

    if (LEFT_KEYS.has(e.key)) {
      actions.shiftLane(-1);
    } else if (RIGHT_KEYS.has(e.key)) {
      actions.shiftLane(1);
    } else if (e.code === 'Space' || e.key === ' ') {
      e.preventDefault(); // Prevent page scroll
      actions.boost();
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
