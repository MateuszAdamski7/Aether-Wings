import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Crystal } from '../../store/types';
import { getWorld, renderPlayer } from '../../game';
import { commitInstances } from './instancing';
import { MAGNET_CONFIG } from '../../config/tuning';

// Pool size; the spawn horizon holds up to ~20 crystals plus a few finishing their pickup animation
const MAX_CRYSTALS = 48;

const BASE_Y = 0.1;
const BOB_SPEED = 4.5;
const BOB_AMOUNT = 0.12;
const SPIN_SPEED = 2.5;
const COLLECT_DURATION = 0.26;
// The pickup flight eases out at the magnet's pull rate, so a magnet-pulled crystal keeps its speed into the pickup
// instead of slowing down where the collection check fires (about the middle lane when pulled from the far one)
const COLLECT_EASE_END = 1 - Math.exp(-MAGNET_CONFIG.pullRate * COLLECT_DURATION);
const COLLECT_SPIN_SPEED = 25;
const COLLECT_TARGET_Y = 0.05;
const RING_Y = BASE_Y - 0.4;

interface CrystalVisual {
  phase: number;
  rotationY: number;
  lastSeenFrame: number;
  /** Pickup flight, animated relative to the ship (like the magnet pull before it) */
  collect: { offsetX: number; offsetZ: number; startY: number; ringX: number; ringZ: number; elapsed: number } | null;
}

// Parsed once per distinct crystal color
const colorCache = new Map<string, THREE.Color>();
function cachedColor(hex: string): THREE.Color {
  let color = colorCache.get(hex);
  if (!color) {
    color = new THREE.Color(hex);
    colorCache.set(hex, color);
  }
  return color;
}

/** Tints the emissive term with the per-instance color, so one material serves every crystal color */
function tintEmissiveByInstanceColor(shader: THREE.WebGLProgramParametersWithUniforms): void {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <emissivemap_fragment>',
    '#include <emissivemap_fragment>\n#ifdef USE_COLOR\n  totalEmissiveRadiance *= vColor.rgb;\n#endif'
  );
}

const NO_CRYSTALS: readonly Crystal[] = [];

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _rotation = new THREE.Quaternion();
const _ringColor = new THREE.Color();
const _yAxis = new THREE.Vector3(0, 1, 0);
const _ringRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

/**
 * All crystals rendered as two instanced meshes (spinning octahedron + floor halo).
 * Positions come from the simulation; crystals homing in on the ship are drawn relative to its interpolated position.
 */
export default function Crystals() {
  const gemRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const visuals = useRef(new Map<string, CrystalVisual>());
  const frame = useRef(0);

  useFrame((state, delta) => {
    const gems = gemRef.current;
    const rings = ringRef.current;
    if (!gems || !rings) return;

    const world = getWorld();
    const crystals = world?.crystals ?? NO_CRYSTALS;
    const shipX = renderPlayer.x;
    const playerZ = renderPlayer.z;
    // Simulated ship position, for converting crystal positions into offsets from the ship
    const simShipX = world?.player.x ?? shipX;
    const simShipZ = world?.player.z ?? playerZ;
    const time = state.clock.getElapsedTime();
    const currentFrame = ++frame.current;
    let count = 0;

    for (const crystal of crystals) {
      if (count >= MAX_CRYSTALS) break;

      let visual = visuals.current.get(crystal.id);
      if (!visual) {
        visual = { phase: Math.random() * Math.PI * 2, rotationY: 0, lastSeenFrame: 0, collect: null };
        visuals.current.set(crystal.id, visual);
      }
      visual.lastSeenFrame = currentFrame;

      let scale = 1;
      let fade = 1;

      if (!crystal.collected) {
        visual.rotationY = time * SPIN_SPEED + visual.phase;
        const bobY = BASE_Y + Math.sin(time * BOB_SPEED + visual.phase) * BOB_AMOUNT;
        if (crystal.magnetized) {
          // Homing crystals move with the ship, so they follow its interpolated position (raw steps would jitter)
          _position.set(shipX + crystal.x - simShipX, bobY, playerZ + crystal.z - simShipZ);
        } else {
          _position.set(crystal.x, bobY, crystal.z);
        }
      } else {
        // Homing pickup: fly into the ship while shrinking and spinning fast
        if (!visual.collect) {
          const startY = BASE_Y + Math.sin(time * BOB_SPEED + visual.phase) * BOB_AMOUNT;
          visual.collect = {
            offsetX: crystal.x - simShipX,
            offsetZ: crystal.z - simShipZ,
            startY,
            ringX: crystal.x,
            ringZ: crystal.z,
            elapsed: 0,
          };
        }
        const pickup = visual.collect;
        pickup.elapsed += delta;
        const progress = pickup.elapsed / COLLECT_DURATION;
        if (progress >= 1) continue;

        scale = 1 - progress;
        fade = 1 - progress;
        const travel = (1 - Math.exp(-MAGNET_CONFIG.pullRate * pickup.elapsed)) / COLLECT_EASE_END;
        visual.rotationY += delta * COLLECT_SPIN_SPEED;
        _position.set(
          shipX + pickup.offsetX * (1 - travel),
          THREE.MathUtils.lerp(pickup.startY, COLLECT_TARGET_Y, travel),
          playerZ + pickup.offsetZ * (1 - travel)
        );
      }

      const color = cachedColor(crystal.color);
      _rotation.setFromAxisAngle(_yAxis, visual.rotationY);
      gems.setMatrixAt(count, _matrix.compose(_position, _rotation, _scale.setScalar(scale)));
      gems.setColorAt(count, color);

      // The halo follows the crystal, then stays on the floor where it was picked up; fading is approximated by darkening
      _position.set(visual.collect?.ringX ?? _position.x, RING_Y, visual.collect?.ringZ ?? _position.z);
      rings.setMatrixAt(count, _matrix.compose(_position, _ringRotation, _scale.setScalar(scale)));
      rings.setColorAt(count, _ringColor.copy(color).multiplyScalar(fade));

      count++;
    }

    // Drop visual state of crystals that left the track
    for (const [id, visual] of visuals.current) {
      if (visual.lastSeenFrame !== currentFrame) visuals.current.delete(id);
    }

    commitInstances(gems, count);
    commitInstances(rings, count);
  });

  // frustumCulled is off: the bounding sphere would be computed once and go stale as instances move
  return (
    <group>
      <instancedMesh ref={gemRef} args={[undefined, undefined, MAX_CRYSTALS]} count={0} frustumCulled={false}>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          emissive="#ffffff"
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.9}
          onBeforeCompile={tintEmissiveByInstanceColor}
        />
      </instancedMesh>

      <instancedMesh ref={ringRef} args={[undefined, undefined, MAX_CRYSTALS]} count={0} frustumCulled={false}>
        <ringGeometry args={[0.2, 0.28, 6]} />
        <meshBasicMaterial transparent opacity={0.3} />
      </instancedMesh>
    </group>
  );
}
