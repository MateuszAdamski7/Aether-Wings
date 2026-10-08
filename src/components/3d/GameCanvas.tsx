import { useEffect, useRef, Suspense, lazy, type ComponentType } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { getWorld, renderPlayer } from '../../game';
import { CAMERA_CONFIG } from '../../config/tuning';
import PerfTelemetry from './PerfTelemetry';
import Ship from './Ship';
import Track from './Track';
import Obstacles from './Obstacles';
import Crystals from './Crystals';
import PowerUps from './PowerUps';
import Environment from './Environment';

const _lookTarget = new THREE.Vector3();

/** 0 for landscape/square screens, rising to 1 at CAMERA_CONFIG.portraitFullAspect */
function getPortraitBlend(aspect: number): number {
  const range = 1 - CAMERA_CONFIG.portraitFullAspect;
  return THREE.MathUtils.clamp((1 - aspect) / range, 0, 1);
}

// 1. Chase Camera Controller
// Follows the ship with a slight delay along X and Y to add weight and feel,
// and uses a fast Z-axis lerp to smooth out high-frequency Z position jitter.
function ChaseCamera() {
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);

  const offsetZRef = useRef(5.5);
  const isInitialized = useRef(false);

  useFrame((state, delta) => {
    const { camera } = state;
    // Limit delta to avoid jumps
    const dt = Math.min(delta, 0.1);

    // Read fast-changing values non-reactively
    const world = getWorld();
    const { gameState } = useGameStore.getState();
    const playerZ = renderPlayer.z;
    const currentShipX = renderPlayer.x;
    const boostTimeRemaining = world?.timers.boostRemaining ?? 0;
    const boostActive = boostTimeRemaining > 0;

    // Initialize offset on the first frame to avoid a camera jump
    if (!isInitialized.current) {
      offsetZRef.current = 5.5; // lock to default offset
      camera.position.z = playerZ - 5.5;
      isInitialized.current = true;
    }

    // Target positions
    let targetX = currentShipX * 0.45; // Camera drifts slightly less than ship to keep center focus
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

    // Portrait framing: wider FOV and a higher, farther camera keep all lanes visible
    const portraitBlend = getPortraitBlend(state.size.width / state.size.height);
    targetY += CAMERA_CONFIG.portraitExtraOffsetY * portraitBlend;
    let targetZ = playerZ - offsetZRef.current - CAMERA_CONFIG.portraitExtraOffsetZ * portraitBlend;

    if (camera instanceof THREE.PerspectiveCamera) {
      const targetFov = THREE.MathUtils.lerp(CAMERA_CONFIG.baseFov, CAMERA_CONFIG.portraitFov, portraitBlend);
      if (Math.abs(camera.fov - targetFov) > 0.01) {
        camera.fov = targetFov;
        camera.updateProjectionMatrix();
      }
    }

    // Apply intense shaking during collision (only while playing, not when game over is active)
    if (collisionTriggered && gameState === 'PLAYING') {
      const time = state.clock.getElapsedTime();
      const shakeSpeed = 45;
      const shakeIntensity = 0.28;
      targetX += Math.sin(time * shakeSpeed) * shakeIntensity;
      targetY += Math.cos(time * (shakeSpeed * 1.1)) * shakeIntensity;
      targetZ += Math.sin(time * (shakeSpeed * 0.9)) * shakeIntensity;
    }

    // Smoothly interpolate camera position
    // X and Y are slower for inertia, Z is locked to the player to eliminate jitter/stutter
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, dt * 7);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, dt * 7);
    camera.position.z = targetZ;

    // Camera looks slightly in front of the ship (zero allocation)
    _lookTarget.set(currentShipX * 0.6, 0.15, playerZ + 7.5);
    camera.lookAt(_lookTarget);
  });

  return null;
}

// 2. Game Loop Synchronizer
// Drives the Zustand store tick in lockstep with the requestAnimationFrame loop
// Runs before every other frame callback, so all render code reads the world after this frame's steps.
// Otherwise callbacks run in mount order, and the camera (mounted first) and the ship (mounted on start)
// would see different simulation times, making the ship jump back and forth relative to the camera.
const SIMULATION_FRAME_PRIORITY = -1; // Negative: runs first without taking over rendering (only > 0 does)

function GameLoopManager() {
  const tick = useGameStore((state) => state.tick);

  useFrame((_state, delta) => {
    const clampedDelta = Math.min(delta, 0.1);
    tick(clampedDelta);
  }, SIMULATION_FRAME_PRIORITY);

  return null;
}

// 3. Post-processing is code-split: only HIGH quality downloads it.
// If the chunk fails to load (network error, stale deploy), the game keeps running without bloom
// instead of the error taking down the whole canvas.
const PostEffects = lazy<ComponentType>(() =>
  import('./PostEffects').catch((err: unknown) => {
    console.warn('[GameCanvas] Post-processing unavailable, continuing without it:', err);
    return { default: () => null };
  })
);

export default function GameCanvas() {
  const setSceneReady = useGameStore((state) => state.setSceneReady);
  useEffect(() => setSceneReady(), [setSceneReady]);

  const gameState = useGameStore((state) => state.gameState);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const showPerfStats = useGameStore((state) => state.showPerfStats);

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
      <Canvas
        gl={{ antialias: false, powerPreference: 'high-performance', toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={graphicsQuality === 'HIGH' ? Math.min(1.5, window.devicePixelRatio) : 1.0}
        camera={{ position: [0, 2, -5], fov: 65, near: 0.1, far: 250 }}
      >
        {/* Real-time WebGL telemetry (FPS, CPU, Draw Calls, Triangles, Geometries, Textures, Memory) */}
        {showPerfStats && <PerfTelemetry />}

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
        {gameState !== 'START' && (
          <Suspense fallback={null}>
            <Ship />
          </Suspense>
        )}

        {/* Chase Camera controller */}
        <ChaseCamera />

        {/* Drives state engine updates */}
        <GameLoopManager />

        {/* Post-Processing Effects Composer */}
        {graphicsQuality === 'HIGH' && (
          <Suspense fallback={null}>
            <PostEffects />
          </Suspense>
        )}
      </Canvas>
    </div>
  );
}
