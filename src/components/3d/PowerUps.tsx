import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore';
import type { PowerUp } from '../../store/useGameStore';
import * as THREE from 'three';

export default function PowerUps() {
  const powerUps = useGameStore((state) => state.powerUps);

  return (
    <group>
      {powerUps.map((pw) => (
        <PowerUpInstance key={pw.id} powerUp={pw} />
      ))}
    </group>
  );
}

function PowerUpInstance({ powerUp }: { powerUp: PowerUp }) {
  const meshRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const phaseOffset = useRef<number | null>(null);

  useFrame((state, delta) => {
    if (powerUp.collected) return;

    if (phaseOffset.current === null) {
      phaseOffset.current = Math.random() * Math.PI * 2;
    }
    const currentPhaseOffset = phaseOffset.current;

    const time = state.clock.getElapsedTime();
    const { slowMoActiveTime } = useGameStore.getState();
    const slowMoActive = slowMoActiveTime > 0;
    const dt = Math.min(delta, 0.1) * (slowMoActive ? 0.65 : 1.0);

    if (meshRef.current) {
      // Rotation & Bobbing
      meshRef.current.rotation.y += dt * 3.0;
      meshRef.current.position.y = 0.15 + Math.sin(time * 4.0 + currentPhaseOffset) * 0.1;
    }

    if (ringRef.current) {
      // Rotate the ground ring slowly
      ringRef.current.rotation.z -= dt * 1.5;
    }
  });

  if (powerUp.collected) return null;

  // Set colors based on type
  const color = powerUp.type === 'SHIELD' 
    ? '#00f3ff' // Cyan
    : powerUp.type === 'MAGNET' 
      ? '#ff007f' // Pink/Magenta
      : '#ffe600'; // Yellow

  return (
    <group ref={meshRef} position={[powerUp.x, 0.15, powerUp.z]}>
      {/* 3D Model Representation based on PowerUp type */}
      {powerUp.type === 'SHIELD' && (
        <group>
          {/* Wireframe outer bubble */}
          <mesh castShadow>
            <sphereGeometry args={[0.26, 12, 12]} />
            <meshBasicMaterial 
              color={color} 
              wireframe={true} 
              transparent={true} 
              opacity={0.8} 
            />
          </mesh>
          {/* Inner solid core */}
          <mesh>
            <boxGeometry args={[0.12, 0.12, 0.12]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={1.2} 
            />
          </mesh>
        </group>
      )}

      {powerUp.type === 'MAGNET' && (
        <group rotation={[0, 0, Math.PI / 4]}>
          {/* U-Shape Horseshoe Magnet (Torus/Cylinder combination) */}
          <mesh castShadow>
            <torusGeometry args={[0.18, 0.05, 8, 16, Math.PI]} />
            <meshStandardMaterial 
              color={color} 
              emissive={color} 
              emissiveIntensity={1.2} 
              metalness={0.8}
            />
          </mesh>
          {/* Left pole */}
          <mesh position={[-0.18, 0.08, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
            <meshStandardMaterial color="#ffffff" metalness={0.9} />
          </mesh>
          {/* Right pole */}
          <mesh position={[0.18, 0.08, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.15, 6]} />
            <meshStandardMaterial color="#ffffff" metalness={0.9} />
          </mesh>
        </group>
      )}

      {powerUp.type === 'SLOWMO' && (
        <group>
          {/* Hourglass double cone */}
          <group position={[0, 0.08, 0]}>
            <mesh castShadow>
              <coneGeometry args={[0.16, 0.22, 6]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={1.2} 
                flatShading={true}
              />
            </mesh>
          </group>
          <group position={[0, -0.08, 0]} rotation={[Math.PI, 0, 0]}>
            <mesh castShadow>
              <coneGeometry args={[0.16, 0.22, 6]} />
              <meshStandardMaterial 
                color={color} 
                emissive={color} 
                emissiveIntensity={1.2} 
                flatShading={true}
              />
            </mesh>
          </group>
        </group>
      )}

      {/* Ground indicator halo */}
      <mesh ref={ringRef} position={[0, -0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.32, 4]} />
        <meshBasicMaterial 
          color={color} 
          transparent={true} 
          opacity={0.35} 
          wireframe={true}
        />
      </mesh>
    </group>
  );
}
