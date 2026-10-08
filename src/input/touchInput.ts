/**
 * Touch steering: a horizontal swipe shifts the ship by one lane.
 */

/** Screen-space direction: -1 = swipe left, 1 = swipe right */
export type SwipeDirection = -1 | 1;

const MIN_SWIPE_PX = 28;
const SWIPE_SCREEN_RATIO = 0.05;
const INTERACTIVE_SELECTOR = 'button, a, input, select, [role="button"]';

interface ActiveSwipe {
  pointerId: number;
  originX: number;
  originY: number;
}

export function attachSwipeInput(onSwipe: (direction: SwipeDirection) => void): () => void {
  let active: ActiveSwipe | null = null;

  const handlePointerDown = (e: PointerEvent) => {
    if (e.pointerType !== 'touch') return;
    if (e.target instanceof Element && e.target.closest(INTERACTIVE_SELECTOR)) return;
    // A new finger starts a new gesture (allows quick alternating swipes with two thumbs)
    active = { pointerId: e.pointerId, originX: e.clientX, originY: e.clientY };
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!active || e.pointerId !== active.pointerId) return;

    const dx = e.clientX - active.originX;
    const dy = e.clientY - active.originY;
    const threshold = Math.max(MIN_SWIPE_PX, window.innerWidth * SWIPE_SCREEN_RATIO);
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy)) return;

    // One gesture = one lane; the rest of this touch is ignored until the finger lifts
    active = null;
    onSwipe(dx > 0 ? 1 : -1);
  };

  const handlePointerEnd = (e: PointerEvent) => {
    if (active?.pointerId === e.pointerId) active = null;
  };

  window.addEventListener('pointerdown', handlePointerDown);
  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerEnd);
  window.addEventListener('pointercancel', handlePointerEnd);

  return () => {
    window.removeEventListener('pointerdown', handlePointerDown);
    window.removeEventListener('pointermove', handlePointerMove);
    window.removeEventListener('pointerup', handlePointerEnd);
    window.removeEventListener('pointercancel', handlePointerEnd);
  };
}
