import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { getWorld, renderPlayer } from '../../game';

// Power-ups spawn with a 15% chance per row, so a handful of slots covers the spawn horizon
const MAX_POWERUPS = 4;

const BASE_Y = 0.15;
const BOB_SPEED = 4.0;
const BOB_AMOUNT = 0.1;
const SPIN_SPEED = 3.0;
const HALO_SPIN_SPEED = 1.5;
const HALO_OPACITY = 0.35;
const COLLECT_DURATION = 0.26; // Matches crystals pickup duration
const COLLECT_SPIN_SPEED = 25;
const COLLECT_TARGET_Y = 0.05;

const SHIELD_COLOR = new THREE.Color('#00f3ff');
const MAGNET_COLOR = new THREE.Color('#ff007f');

// Shared across all slots so nothing is allocated or uploaded while playing
const SHIELD_SHELL_GEOMETRY = new THREE.SphereGeometry(0.26, 12, 12);
const SHIELD_CORE_GEOMETRY = new THREE.BoxGeometry(0.12, 0.12, 0.12);
const MAGNET_ARC_GEOMETRY = new THREE.TorusGeometry(0.18, 0.05, 8, 16, Math.PI);
const MAGNET_POLE_GEOMETRY = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 6);
const HALO_GEOMETRY = new THREE.RingGeometry(0.22, 0.32, 4);

interface PowerUpVisual {
  phase: number;
  collect: { startX: number; startY: number; startZ: number; elapsed: number } | null;
}

// Per-power-up animation state keyed by id, so it survives the array shifting when an old power-up
// is cleaned up (slot i always shows world.powerUps[i]). Module-level: there is a single PowerUps.
const visuals = new Map<string, PowerUpVisual>();

const SLOTS = Array.from({ length: MAX_POWERUPS }, (_, slot) => slot);

/** Fixed pool of slots reading power-ups straight from the World every frame */
export default function PowerUps() {
  // Drop visual state of power-ups that left the track
  useFrame(() => {
    const powerUps = getWorld()?.powerUps;
    for (const id of visuals.keys()) {
      if (!powerUps?.some((powerUp) => powerUp.id === id)) visuals.delete(id);
    }
  });

  return (
    <group>
      {SLOTS.map((slot) => (
        <PowerUpSlot key={slot} slot={slot} />
      ))}
    </group>
  );
}

const _target = new THREE.Vector3();
const _start = new THREE.Vector3();

function PowerUpSlot({ slot }: { slot: number }) {
  const rootRef = useRef<THREE.Group>(null);
  const modelRef = useRef<THREE.Group>(null);
  const shieldRef = useRef<THREE.Group>(null);
  const magnetRef = useRef<THREE.Group>(null);
  const haloRef = useRef<THREE.Mesh>(null);
  const haloMaterialRef = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((state, delta) => {
    const root = rootRef.current;
    const model = modelRef.current;
    const shield = shieldRef.current;
    const magnet = magnetRef.current;
    const halo = haloRef.current;
    const haloMaterial = haloMaterialRef.current;
    if (!root || !model || !shield || !magnet || !halo || !haloMaterial) return;

    const world = getWorld();
    const powerUp = world?.powerUps[slot];
    if (!world || !powerUp) {
      root.visible = false;
      return;
    }

    let visual = visuals.get(powerUp.id);
    if (!visual) {
      visual = { phase: Math.random() * Math.PI * 2, collect: null };
      visuals.set(powerUp.id, visual);
    }

    const isShield = powerUp.type === 'SHIELD';
    shield.visible = isShield;
    magnet.visible = !isShield;
    haloMaterial.color.copy(isShield ? SHIELD_COLOR : MAGNET_COLOR);
    root.position.set(powerUp.x, BASE_Y, powerUp.z);
    const dt = Math.min(delta, 0.1);

    if (!powerUp.collected) {
      // Idle: rotate and bob above a spinning floor halo
      root.visible = true;
      model.rotation.y += dt * SPIN_SPEED;
      model.position.set(0, Math.sin(state.clock.getElapsedTime() * BOB_SPEED + visual.phase) * BOB_AMOUNT, 0);
      model.scale.setScalar(1);
      halo.rotation.z -= dt * HALO_SPIN_SPEED;
      halo.scale.setScalar(1);
      haloMaterial.opacity = HALO_OPACITY;
      return;
    }

    // Homing pickup: fly into the ship while shrinking and spinning fast
    if (!visual.collect) {
      visual.collect = { startX: powerUp.x, startY: BASE_Y + model.position.y, startZ: powerUp.z, elapsed: 0 };
    }
    const pickup = visual.collect;
    pickup.elapsed += delta;
    const progress = pickup.elapsed / COLLECT_DURATION;
    if (progress >= 1) {
      root.visible = false;
      return;
    }

    root.visible = true;
    const scale = 1 - progress;
    _start.set(pickup.startX, pickup.startY, pickup.startZ);
    _target.set(renderPlayer.x, COLLECT_TARGET_Y, renderPlayer.z);
    _start.lerp(_target, progress);
    model.position.set(_start.x - powerUp.x, _start.y - BASE_Y, _start.z - powerUp.z);
    model.scale.setScalar(scale);
    model.rotation.y += delta * COLLECT_SPIN_SPEED;
    halo.scale.setScalar(scale);
    haloMaterial.opacity = HALO_OPACITY * (1 - progress);
  });

  return (
    <group ref={rootRef} visible={false}>
      <group ref={modelRef}>
        <group ref={shieldRef}>
          {/* Wireframe outer bubble */}
          <mesh geometry={SHIELD_SHELL_GEOMETRY}>
            <meshBasicMaterial color={SHIELD_COLOR} wireframe transparent opacity={0.8} />
          </mesh>
          {/* Inner solid core */}
          <mesh geometry={SHIELD_CORE_GEOMETRY}>
            <meshStandardMaterial color={SHIELD_COLOR} emissive={SHIELD_COLOR} emissiveIntensity={1.2} />
          </mesh>
        </group>

        <group ref={magnetRef} rotation={[0, 0, Math.PI / 4]}>
          {/* U-Shape Horseshoe Magnet (Torus/Cylinder combination) */}
          <mesh geometry={MAGNET_ARC_GEOMETRY}>
            <meshStandardMaterial color={MAGNET_COLOR} emissive={MAGNET_COLOR} emissiveIntensity={1.2} metalness={0.8} />
          </mesh>
          <mesh position={[-0.18, 0.08, 0]} geometry={MAGNET_POLE_GEOMETRY}>
            <meshStandardMaterial color="#ffffff" metalness={0.9} />
          </mesh>
          <mesh position={[0.18, 0.08, 0]} geometry={MAGNET_POLE_GEOMETRY}>
            <meshStandardMaterial color="#ffffff" metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Ground indicator halo */}
      <mesh ref={haloRef} position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]} geometry={HALO_GEOMETRY}>
        <meshBasicMaterial ref={haloMaterialRef} transparent opacity={HALO_OPACITY} wireframe />
      </mesh>
    </group>
  );
}
