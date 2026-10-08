import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Obstacle } from '../../store/types';
import { getWorld } from '../../game';
import { commitInstances } from './instancing';
import { HAZARD_COLORS, SECTOR_1_END_Z, SECTOR_2_END_Z, getHazardColor } from '../../config/sectors';

// Pool size per layer; spawn horizon (~180 units) holds about 12 obstacles at once
const MAX_OBSTACLES = 32;

const CORE_DEPTH = 0.4;
const OUTLINE_PADDING = 0.05;
const OUTLINE_DEPTH = 0.45;
const ACCENT_HEIGHT = 0.08;
const ACCENT_DEPTH = 0.02;
const ACCENT_WIDTH_RATIO = 0.4;
const ACCENT_TOP_INSET = 0.1;
const ACCENT_FRONT_OFFSET = 0.22;
const GROUND_OFFSET_Y = -0.45;

// Parsed once; getHazardColor() picks the sector, this maps its hex to a reusable Color
const HAZARD_COLOR_BY_HEX = new Map<string, THREE.Color>(
  Object.values(HAZARD_COLORS).map((hex) => [hex, new THREE.Color(hex)])
);
const ACCENT_DEFAULT = new THREE.Color('#ffe600');
const ACCENT_SECTOR_2 = new THREE.Color('#39ff14');

const NO_OBSTACLES: readonly Obstacle[] = [];

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _noRotation = new THREE.Quaternion();

/**
 * All obstacles rendered as three instanced layers (dark core, neon wireframe, accent strip).
 * Positions come straight from the simulation every frame (moving obstacles included),
 * so spawning/cleanup never mounts React components or allocates GPU buffers.
 */
export default function Obstacles() {
  const coreRef = useRef<THREE.InstancedMesh>(null);
  const outlineRef = useRef<THREE.InstancedMesh>(null);
  const accentRef = useRef<THREE.InstancedMesh>(null);
  const overflowWarned = useRef(false);

  useFrame(() => {
    const core = coreRef.current;
    const outline = outlineRef.current;
    const accent = accentRef.current;
    if (!core || !outline || !accent) return;

    const obstacles = getWorld()?.obstacles ?? NO_OBSTACLES;
    if (obstacles.length > MAX_OBSTACLES && !overflowWarned.current) {
      overflowWarned.current = true;
      console.warn(`[Obstacles] ${obstacles.length} obstacles exceed the pool of ${MAX_OBSTACLES}`);
    }
    const count = Math.min(obstacles.length, MAX_OBSTACLES);

    for (let i = 0; i < count; i++) {
      const { x, z, width, height } = obstacles[i];
      const centerY = height / 2 + GROUND_OFFSET_Y;

      _position.set(x, centerY, z);
      core.setMatrixAt(i, _matrix.compose(_position, _noRotation, _scale.set(width, height, CORE_DEPTH)));
      outline.setMatrixAt(
        i,
        _matrix.compose(
          _position,
          _noRotation,
          _scale.set(width + OUTLINE_PADDING, height + OUTLINE_PADDING, OUTLINE_DEPTH)
        )
      );

      _position.set(x, centerY + height / 2 - ACCENT_TOP_INSET, z + ACCENT_FRONT_OFFSET);
      accent.setMatrixAt(
        i,
        _matrix.compose(_position, _noRotation, _scale.set(width * ACCENT_WIDTH_RATIO, ACCENT_HEIGHT, ACCENT_DEPTH))
      );

      const isSector2 = z >= SECTOR_1_END_Z && z < SECTOR_2_END_Z;
      outline.setColorAt(i, HAZARD_COLOR_BY_HEX.get(getHazardColor(z))!);
      accent.setColorAt(i, isSector2 ? ACCENT_SECTOR_2 : ACCENT_DEFAULT);
    }

    commitInstances(core, count);
    commitInstances(outline, count);
    commitInstances(accent, count);
  });

  // frustumCulled is off: the bounding sphere would be computed once and go stale as instances move
  return (
    <group>
      <instancedMesh ref={coreRef} args={[undefined, undefined, MAX_OBSTACLES]} count={0} frustumCulled={false}>
        <boxGeometry />
        <meshStandardMaterial color="#060613" roughness={0.9} transparent opacity={0.8} />
      </instancedMesh>

      <instancedMesh ref={outlineRef} args={[undefined, undefined, MAX_OBSTACLES]} count={0} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial wireframe />
      </instancedMesh>

      <instancedMesh ref={accentRef} args={[undefined, undefined, MAX_OBSTACLES]} count={0} frustumCulled={false}>
        <boxGeometry />
        <meshBasicMaterial />
      </instancedMesh>
    </group>
  );
}
