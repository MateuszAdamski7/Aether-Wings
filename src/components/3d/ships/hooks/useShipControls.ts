import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../../store/useGameStore';
import * as THREE from 'three';

export function useShipControls(
  meshRef: React.RefObject<THREE.Group | null>
) {
  const lastPointerX = useRef(0);
  const controlMode = useGameStore((state) => state.controlMode);
  const setMouseX = useGameStore((state) => state.setMouseX);
  const setShipX = useGameStore((state) => state.setShipX);
  const gameState = useGameStore((state) => state.gameState);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Read fast-changing variables non-reactively from the store
    const { targetX, playerZ, boostActive, slowMoActiveTime } = useGameStore.getState();

    // Limit delta to avoid huge physics jumps on frame lag. Scale by 0.65 during slow-mo.
    const dt = Math.min(delta, 0.1) * (slowMoActiveTime > 0 ? 0.65 : 1.0);

    // 1. INPUT INTERPRETATION (Mouse tracking)
    // Check if the mouse has moved significantly (meaning the user is active with mouse)
    const currentPointerX = state.pointer.x;
    if (gameState === 'PLAYING' && !collisionTriggered) {
      const pointerDelta = Math.abs(currentPointerX - lastPointerX.current);
      // Require a larger, deliberate movement (0.06) to switch from KEYBOARD to MOUSE mode
      const threshold = controlMode === 'KEYBOARD' ? 0.06 : 0.003;
      if (pointerDelta > threshold) {
        // Map pointer [-1, 1] to track boundaries [-3.0, 3.0] (negated due to camera direction)
        setMouseX(-currentPointerX * 3.2);
        lastPointerX.current = currentPointerX;
      }
    }

    // 2. POSITION TRANSLATION (Smooth Lerp)
    // The ship Z coordinate is exactly the playerZ coordinate (moves forward)
    // The ship X coordinate lerps towards the store's targetX
    const currentX = meshRef.current.position.x;
    
    // Lerp rate changes depending on whether we are boosting (smooth center alignment) or using keyboard/mouse
    const lerpSpeed = boostActive ? 4.5 : (controlMode === 'KEYBOARD' ? 12 : 18);
    const nextX = THREE.MathUtils.lerp(currentX, targetX, dt * lerpSpeed);
    
    meshRef.current.position.x = nextX;
    meshRef.current.position.z = playerZ; // stay locked to the gameplay camera scroll
    
    // Write back the actual visual X position to the store so collision box matches perfectly
    setShipX(nextX);

    // 3. TILT & ROLL ANIMATION (Banking)
    // Roll (Z rotation) is proportional to the speed of horizontal movement
    // Yaw (Y rotation) twists slightly into the turn
    const xVelocity = nextX - currentX;
    
    // Target rotations
    const targetRoll = -xVelocity * 3.5; // roll left/right
    const targetYaw = -xVelocity * 1.5;  // turn left/right

    if (!collisionTriggered) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z, 
        THREE.MathUtils.clamp(targetRoll, -0.45, 0.45), // cap roll at ~25 degrees
        dt * 10
      );

      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        THREE.MathUtils.clamp(targetYaw, -0.25, 0.25),
        dt * 10
      );

      // Pitch (X rotation) - subtle bobbing up and down
      if (gameState === 'PLAYING') {
        const bobbing = Math.sin(state.clock.getElapsedTime() * 4) * 0.03;
        meshRef.current.position.y = bobbing;
        meshRef.current.rotation.x = bobbing * 0.5;
      }
    }
  });
}
