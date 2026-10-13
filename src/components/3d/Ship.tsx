import { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import { useGameStore } from '../../store/useGameStore';
import { getWorld, renderPlayer } from '../../game';
import * as THREE from 'three';

const SHIP_MODEL_PATH = '/models/ship.glb';

// Banking per unit/s of lateral speed (previously tuned per frame at 60 fps: 3.5 and 1.5)
const BANK_ROLL_PER_SPEED = 3.5 / 60;
const BANK_YAW_PER_SPEED = 1.5 / 60;

// Preload the GLTF ship model immediately
useGLTF.preload(SHIP_MODEL_PATH);

// Engine flames are the part of a cone (tip toward the ship) that lies behind the hull.
// The cone used to be scaled around its center, so during boost its tip pierced the whole ship and stuck out of the nose.
// Now the flame starts at the hull's rear surface and only extends backward; the visible part is the same as before.
const FLAME_ROOT_Z = -0.54; // Rear surface of the hull behind the nozzles (at the 0.72 model scale)
const FLAME_CONE_CENTER_Z = -0.7;
const FLAME_CONE_HEIGHT = 0.42;
const FLAME_CONE_RADIUS = 0.06;
const FLAME_NOZZLES_X = [-0.14, 0.14];
const FLAME_Y = -0.075;
const FLAME_SCALE = {
  normal: { xz: 1.0, y: 1.7 },
  boost: { xz: 2.8, y: 2.8 * 3.2 },
};

/** Distance from the hull to the base of a cone stretched by scaleY around its center */
function flameLength(scaleY: number): number {
  return FLAME_ROOT_Z - FLAME_CONE_CENTER_Z + (FLAME_CONE_HEIGHT / 2) * scaleY;
}

/** The cone of the given scale cut off at the hull: a frustum with its narrow end at the origin, extending along -Y */
function createFlameGeometry(scaleXZ: number, scaleY: number): THREE.CylinderGeometry {
  const length = flameLength(scaleY);
  const baseRadius = FLAME_CONE_RADIUS * scaleXZ;
  const coneHeight = FLAME_CONE_HEIGHT * scaleY;
  const rootRadius = baseRadius * (coneHeight - length) / coneHeight;
  const geometry = new THREE.CylinderGeometry(rootRadius, baseRadius, length, 6);
  geometry.translate(0, -length / 2, 0);
  return geometry;
}

// Flickering dual engine plume component aligned with the 3D model's twin rear exhausts
function DualEngineFlames() {
  const groupRef = useRef<THREE.Group>(null);
  const geometries = useMemo(
    () => ({
      normal: createFlameGeometry(FLAME_SCALE.normal.xz, FLAME_SCALE.normal.y),
      boost: createFlameGeometry(FLAME_SCALE.boost.xz, FLAME_SCALE.boost.y),
    }),
    []
  );
  useEffect(() => {
    return () => {
      geometries.normal.dispose();
      geometries.boost.dispose();
    };
  }, [geometries]);

  useFrame((state) => {
    if (!groupRef.current) return;
    const boostActive = (getWorld()?.timers.boostRemaining ?? 0) > 0;
    const flameColor = boostActive ? '#ffe600' : '#00f3ff';
    const nominal = boostActive ? FLAME_SCALE.boost : FLAME_SCALE.normal;

    const flickerSpeed = boostActive ? 80 : 45;
    const scaleYFactor = nominal.y + Math.sin(state.clock.getElapsedTime() * flickerSpeed) * 0.15;
    const scaleXZFactor = nominal.xz + Math.sin(state.clock.getElapsedTime() * (flickerSpeed + 5)) * 0.08;
    // The geometry already has the nominal size; flicker stretches it relative to that, keeping the root on the hull
    const lengthScale = flameLength(scaleYFactor) / flameLength(nominal.y);
    const radiusScale = scaleXZFactor / nominal.xz;

    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.geometry = boostActive ? geometries.boost : geometries.normal;
      mesh.scale.set(radiusScale, lengthScale, radiusScale);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.color.setStyle(flameColor);
      }
    });
  });

  // Dual engine nozzles; rotated so local -Y (the flame) points backward
  return (
    <group ref={groupRef}>
      {FLAME_NOZZLES_X.map((x) => (
        <mesh key={x} position={[x, FLAME_Y, FLAME_ROOT_Z]} rotation={[Math.PI / 2, 0, 0]} geometry={geometries.normal}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0.95} />
        </mesh>
      ))}
    </group>
  );
}

export default function Ship() {
  const meshRef = useRef<THREE.Group>(null);
  const modelWrapperRef = useRef<THREE.Group>(null);
  
  // Game store subscriptions
  const gameState = useGameStore((state) => state.gameState);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);
  const shieldActive = useGameStore((state) => state.shieldActive);
  const shieldStrength = useGameStore((state) => state.shieldStrength);

  const collisionTime = useRef(0);
  const crashAngularVelocity = useRef(new THREE.Vector3(0, 0, 0));

  // Blast wave ref
  const blastMeshRef = useRef<THREE.Mesh>(null);
  const gapProgress = useRef(0);

  // Load the GLB model
  const { scene } = useGLTF(SHIP_MODEL_PATH);
  
  // Clone scene with authentic textures intact - NO color overlays
  const clonedScene = useMemo(() => {
    const clone = scene.clone(true);
    clone.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
      }
    });
    return clone;
  }, [scene]);

  useFrame((state, delta) => {
    if (!meshRef.current) return;
    // Freeze the ship in place (including an unfinished lane change) while paused
    if (gameState === 'PAUSED') return;

    const world = getWorld();
    if (!world) return;
    const playerZ = renderPlayer.z;
    const boostActive = world.timers.boostRemaining > 0;
    const dt = Math.min(delta, 0.1);

    // 1. POSITION (simulated in movementSystem; the ship only displays it)
    const prevX = meshRef.current.position.x;
    const nextX = renderPlayer.x;
    meshRef.current.position.x = nextX;
    meshRef.current.position.z = playerZ;

    // 2. TILT & ROLL ANIMATION (Banking into turns, driven by lateral speed in units/s)
    const lateralSpeed = dt > 0 ? (nextX - prevX) / dt : 0;
    const targetRoll = -lateralSpeed * BANK_ROLL_PER_SPEED;
    const targetYaw = -lateralSpeed * BANK_YAW_PER_SPEED;

    if (!collisionTriggered) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z, 
        THREE.MathUtils.clamp(targetRoll, -0.45, 0.45),
        dt * 10
      );

      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        THREE.MathUtils.clamp(targetYaw, -0.25, 0.25),
        dt * 10
      );

      // Subtle pitch bobbing during normal flight
      if (gameState === 'PLAYING') {
        const bobbing = Math.sin(state.clock.getElapsedTime() * 4) * 0.03;
        meshRef.current.position.y = bobbing + 0.2;
        meshRef.current.rotation.x = bobbing * 0.5;
      }
      
      collisionTime.current = 0;

      // 4. BOOST SCALE & DYNAMICS
      const boostTimeRemaining = world.timers.boostRemaining;
      if (boostActive) {
        if (boostTimeRemaining > 1.0) {
          gapProgress.current = THREE.MathUtils.lerp(gapProgress.current, 1.0, dt * 2.8);
        } else {
          gapProgress.current = Math.max(0.0, boostTimeRemaining);
        }
      } else {
        gapProgress.current = THREE.MathUtils.lerp(gapProgress.current, 0.0, dt * 2.8);
      }
      const g = gapProgress.current;

      // Scale model dynamically during boost
      const currentScale = 0.72 + g * 0.08;
      if (modelWrapperRef.current) {
        modelWrapperRef.current.scale.set(currentScale, currentScale, currentScale);
        modelWrapperRef.current.position.set(0, 0, 0);
        modelWrapperRef.current.rotation.set(0, Math.PI / 2, 0);
      }
    } else {
      // 5. CRASH & COLLISION SIMULATION (Tumble & road impact)
      collisionTime.current += dt;
      const t = collisionTime.current;
      const gravity = -9.8;

      if (collisionTime.current === dt) {
        // Seed initial spin on impact
        crashAngularVelocity.current.set(
          (Math.random() - 0.5) * 8,
          (Math.random() - 0.5) * 12,
          (Math.random() - 0.5) * 10
        );
      }

      const spinDecay = Math.max(0, Math.exp(-t * 2.5));
      if (modelWrapperRef.current) {
        modelWrapperRef.current.rotation.x += crashAngularVelocity.current.x * spinDecay * dt;
        modelWrapperRef.current.rotation.y += crashAngularVelocity.current.y * spinDecay * dt;
        modelWrapperRef.current.rotation.z += crashAngularVelocity.current.z * spinDecay * dt;
      }

      const floorY = -0.32;
      let y = 1.2 * t + 0.5 * gravity * t * t;
      if (y < floorY) y = floorY;
      meshRef.current.position.y = y;
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0.2, dt * 3);
    }

    // 6. SONIC BLAST WAVE EXPANSION
    const blastActiveTime = world.timers.blastActive;
    if (blastMeshRef.current) {
      if (blastActiveTime > 0) {
        const progress = (0.45 - blastActiveTime) / 0.45;
        const radius = progress * 24.0;
        blastMeshRef.current.scale.set(radius, radius, radius);
        const mat = blastMeshRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.8 * (1.0 - progress);
        }
        blastMeshRef.current.visible = true;
      } else {
        blastMeshRef.current.visible = false;
      }
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Sonic Blast Wave Sphere */}
      <mesh ref={blastMeshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color="#ffe600" transparent={true} opacity={0} wireframe={true} />
      </mesh>

      {/* GLB Model Container: Scaled and rotated so nose points along +Z, 100% original model textures */}
      <group ref={modelWrapperRef} scale={[0.72, 0.72, 0.72]} rotation={[0, Math.PI / 2, 0]}>
        <primitive object={clonedScene} />
      </group>

      {/* Dual Thruster Exhaust Plumes */}
      {gameState === 'PLAYING' && !collisionTriggered && <DualEngineFlames />}

      {/* Balanced neutral lighting so original ship textures and details are clear */}
      <pointLight position={[0, 1.4, 0.2]} intensity={2.0} distance={5} color="#ffffff" />

      {/* Under-ship subtle ambient road glow */}
      <pointLight 
        position={[0, -0.25, -0.2]} 
        intensity={2.0} 
        distance={4.5} 
        color="#00f3ff" 
      />

      {/* Hexagonal Cyberpunk Energy Shield Bubble */}
      {shieldActive && (
        <>
          <mesh position={[0, 0.1, 0]}>
            <dodecahedronGeometry args={[0.95, 1]} />
            <meshBasicMaterial 
              color="#00f3ff" 
              wireframe={true} 
              transparent={true} 
              opacity={0.35} 
            />
          </mesh>
          {shieldStrength === 2 && (
            <mesh position={[0, 0.1, 0]}>
              <dodecahedronGeometry args={[1.05, 1]} />
              <meshBasicMaterial 
                color="#ff007f" 
                wireframe={true} 
                transparent={true} 
                opacity={0.25} 
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}
