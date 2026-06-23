import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';
import type { Crystal } from '../store/useGameStore';
import * as THREE from 'three';

export default function Crystals() {
  const crystals = useGameStore((state) => state.crystals);

  return (
    <group>
      {crystals.map((cry) => (
        <CrystalInstance key={cry.id} crystal={cry} />
      ))}
    </group>
  );
}

function CrystalInstance({ crystal }: { crystal: Crystal }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  
  // Phase offset to ensure crystals do not bob in perfect synchronization
  const phaseOffset = useRef(Math.random() * Math.PI * 2);
  const collectTime = useRef(0);
  const isDone = useRef(false);
  const initialWorldPos = useRef<THREE.Vector3 | null>(null);

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime();

    if (crystal.collected) {
      // 1. PLAY HOMING PICKUP ANIMATION (Fly to ship, shrink, spin fast)
      collectTime.current += delta;
      const duration = 0.26; // Slowed down from 0.12s to make flight visible
      const p = Math.min(1.0, collectTime.current / duration);

      if (p >= 1.0) {
        isDone.current = true;
        return;
      }

      const scale = Math.max(0, 1.0 - p);

      // Snapshot the world position at the exact moment of collection
      if (!initialWorldPos.current) {
        const worldPos = new THREE.Vector3();
        if (meshRef.current) {
          meshRef.current.getWorldPosition(worldPos);
        } else {
          worldPos.set(crystal.x, 0.1, crystal.z);
        }
        initialWorldPos.current = worldPos;
      }

      // Get target ship position (center of the fuselage)
      const { shipX, playerZ } = useGameStore.getState();
      const targetWorldPos = new THREE.Vector3(shipX, 0.05, playerZ);

      // Interpolate from start position to ship
      const currentWorldPos = new THREE.Vector3().lerpVectors(
        initialWorldPos.current,
        targetWorldPos,
        p
      );

      // Position mesh relative to its group position [crystal.x, 0.1, crystal.z]
      if (meshRef.current) {
        meshRef.current.scale.set(scale, scale, scale);
        meshRef.current.position.set(
          currentWorldPos.x - crystal.x,
          currentWorldPos.y - 0.1,
          currentWorldPos.z - crystal.z
        );
        meshRef.current.rotation.y += delta * 25.0; // Spin fast as it gets sucked in
      }

      // Fade and shrink halo outline on the track floor
      if (ringRef.current) {
        ringRef.current.scale.set(scale, scale, scale);
        const mat = ringRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0.3 * (1.0 - p);
      }
    } else {
      // 2. NORMAL SPINNING / BOBBING ANIMATION
      if (meshRef.current) {
        meshRef.current.rotation.y += delta * 2.5;
        meshRef.current.position.y = 0.1 + Math.sin(time * 4.5 + phaseOffset.current) * 0.12;
        meshRef.current.position.x = 0;
        meshRef.current.position.z = 0;
        meshRef.current.scale.set(1, 1, 1);
      }
      if (ringRef.current) {
        ringRef.current.scale.set(1, 1, 1);
        const mat = ringRef.current.material as THREE.MeshBasicMaterial;
        if (mat) mat.opacity = 0.3;
      }
    }
  });

  if (isDone.current) return null;

  return (
    <group position={[crystal.x, 0.1, crystal.z]}>
      {/* Spinning Octahedron */}
      <mesh ref={meshRef} castShadow>
        <octahedronGeometry args={[0.3, 0]} />
        <meshStandardMaterial
          color={crystal.color}
          emissive={crystal.color}
          emissiveIntensity={1.5}
          roughness={0.1}
          metalness={0.9}
        />
      </mesh>

      {/* Halo outline ring below the crystal */}
      <mesh ref={ringRef} position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.28, 6]} />
        <meshBasicMaterial 
          color={crystal.color} 
          transparent={true} 
          opacity={0.3} 
        />
      </mesh>
    </group>
  );
}
