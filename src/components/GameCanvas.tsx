import { useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import Ship from './Ship';
import Track from './Track';
import Obstacles from './Obstacles';
import Crystals from './Crystals';
import PowerUps from './PowerUps';
import Environment from './Environment';

// 1. Chase Camera Controller
// Follows the ship with a slight delay along X and Y to add weight and feel,
// and snaps tightly along Z. Adds a screenshake on collision.
function ChaseCamera() {
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);
  const { camera } = useThree();

  const offsetZRef = useRef(5.5);
  const isInitialized = useRef(false);

  useFrame((state, delta) => {
    // Limit delta to avoid jumps
    const dt = Math.min(delta, 0.1);

    // Read fast-changing values non-reactively
    const { playerZ, shipX, boostActive, boostTimeRemaining } = useGameStore.getState();

    // Initialize offset on the first frame to avoid a camera jump
    if (!isInitialized.current) {
      offsetZRef.current = playerZ - camera.position.z;
      isInitialized.current = true;
    }

    // Target positions
    let targetX = shipX * 0.45; // Camera drifts slightly less than ship to keep center focus
    let targetY = boostActive ? 2.1 : 1.9; // raise slightly during boost
    
    // Smoothly interpolate Z offset
    if (boostActive) {
      if (boostTimeRemaining > 1.0) {
        // Zoom out to 6.0 during boost
        offsetZRef.current = THREE.MathUtils.lerp(offsetZRef.current, 6.0, dt * 4.0);
      } else {
        // Zoom back in to 5.5 inside the boost effect over the last 1 second
        offsetZRef.current = 5.5 + 0.5 * Math.max(0.0, boostTimeRemaining);
      }
    } else {
      // Normal zoom level
      offsetZRef.current = THREE.MathUtils.lerp(offsetZRef.current, 5.5, dt * 4.0);
    }

    let targetZ = playerZ - offsetZRef.current;

    // Apply intense shaking during collision
    if (collisionTriggered) {
      const time = state.clock.getElapsedTime();
      const shakeSpeed = 45;
      const shakeIntensity = 0.28;
      targetX += Math.sin(time * shakeSpeed) * shakeIntensity;
      targetY += Math.cos(time * (shakeSpeed * 1.1)) * shakeIntensity;
      targetZ += Math.sin(time * (shakeSpeed * 0.9)) * shakeIntensity;
    }

    // Smoothly interpolate camera position
    // X and Y are slower for inertia, Z tracks offsetZ exactly (no lag due to speed)
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, dt * 7);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, dt * 7);
    camera.position.z = targetZ;

    // Camera looks slightly in front of the ship
    const lookTarget = new THREE.Vector3(
      shipX * 0.6,
      0.15,
      playerZ + 7.5
    );
    camera.lookAt(lookTarget);
  });

  return null;
}

// 2. Game Loop Synchronizer
// Drives the Zustand store tick in lockstep with the requestAnimationFrame loop
function GameLoopManager() {
  const tick = useGameStore((state) => state.tick);

  useFrame((_state, delta) => {
    // Cap delta at 100ms to prevent glitches if tab goes inactive
    tick(Math.min(delta, 0.1));
  });

  return null;
}

export default function GameCanvas() {
  const gameState = useGameStore((state) => state.gameState);
  const boostActive = useGameStore((state) => state.boostActive);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
      <Canvas
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        camera={{ position: [0, 2, -5], fov: 65, near: 0.1, far: 250 }}
      >
        {/* Environment setup (lights, sun, background, mountains) */}
        <Environment />

        {/* Dynamic Track Grid */}
        <Track />

        {/* Obstacles & Hazards */}
        <Obstacles />

        {/* Collectibles */}
        <Crystals />
        <PowerUps />

        {/* Player Spaceship */}
        {gameState !== 'START' && <Ship />}

        {/* Chase Camera controller */}
        <ChaseCamera />

        {/* Drives state engine updates */}
        <GameLoopManager />

        {/* Post-Processing Effects Composer */}
        <EffectComposer>
          {/* Neon Bloom Glow - extra intense during boost */}
          <Bloom
            intensity={boostActive ? 2.6 : 1.5}
            luminanceThreshold={0.12}
            luminanceSmoothing={0.8}
            mipmapBlur={true}
          />
          
          {/* Dark edge vignette for warp speed tunnel vision depth */}
          <Vignette
            eskil={false}
            offset={0.25}
            darkness={boostActive ? 1.45 : 1.1}
            color={boostActive ? "#4d0099" : "#000000"}
          />
        </EffectComposer>
      </Canvas>
    </div>
  );
}
