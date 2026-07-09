import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../store/useGameStore';
import * as THREE from 'three';
import { PALETTE } from '../../config/gameConfig';
import { SKINS_VISUAL_REGISTRY } from './ships/skinsRegistry';
import { useShipControls } from './ships/hooks/useShipControls';
import { useShipAnimations } from './ships/hooks/useShipAnimations';


export default function Ship() {
  const meshRef = useRef<THREE.Group>(null);
  const fuselageRef = useRef<THREE.Group>(null);
  const canopyRef = useRef<THREE.Mesh>(null);
  const leftWingRef = useRef<THREE.Group>(null);
  const rightWingRef = useRef<THREE.Group>(null);
  const nozzleRef = useRef<THREE.Group>(null);
  const absorbMeshRef = useRef<THREE.Group>(null);
  const blastMeshRef = useRef<THREE.Mesh>(null);

  // Superb ships visual component refs
  const vortexCoreRef = useRef<THREE.Group>(null);
  const leftChronoRingRef = useRef<THREE.Mesh>(null);
  const rightChronoRingRef = useRef<THREE.Mesh>(null);
  
  // Get game store state (only subscribe to static/rare elements to prevent React re-renders)
  const gameState = useGameStore((state) => state.gameState);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);
  const shieldActive = useGameStore((state) => state.shieldActive);
  const shieldStrength = useGameStore((state) => state.shieldStrength);
  const equippedSkin = useGameStore((state) => state.upgrades.equippedSkin);
  const skinConfig = SKINS_VISUAL_REGISTRY[equippedSkin] || SKINS_VISUAL_REGISTRY.default;

  // 1. controls and movement mapping updates
  useShipControls(meshRef);

  // 2. physics, transformations, and particle explosion updates
  useShipAnimations(
    {
      meshRef,
      fuselageRef,
      canopyRef,
      leftWingRef,
      rightWingRef,
      nozzleRef,
      absorbMeshRef,
      blastMeshRef,
      vortexCoreRef,
      leftChronoRingRef,
      rightChronoRingRef
    },
    skinConfig.underglowColor
  );

  const ShipComponent = skinConfig.ShipComponent;

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Sonic Blast Wave Sphere */}
      <mesh ref={blastMeshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color={PALETTE.neonYellow} 
          transparent={true} 
          opacity={0} 
          wireframe={true} 
        />
      </mesh>

      {/* Unified ship skin component (Fuselage, Canopy, Wings, Nozzle, Core, and Outlines) */}
      <ShipComponent
        fuselageRef={fuselageRef}
        canopyRef={canopyRef}
        leftWingRef={leftWingRef}
        rightWingRef={rightWingRef}
        nozzleRef={nozzleRef}
        absorbMeshRef={absorbMeshRef}
        leftChronoRingRef={leftChronoRingRef}
        rightChronoRingRef={rightChronoRingRef}
        vortexCoreRef={vortexCoreRef}
      />

      {/* Engine exhaust plume flickering behind the nozzle */}
      {gameState === 'PLAYING' && !collisionTriggered && (
        <group position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
          <EngineFlame color={skinConfig.engineFlameColor} flameType={skinConfig.flameGeometryType} />
        </group>
      )}

      {/* Under-ship point light to cast a glow onto the road grid - dynamically matching active skin */}
      <pointLight 
        position={[0, -0.3, -0.3]} 
        intensity={1.5} 
        distance={4} 
        color={skinConfig.underglowColor}
      />

      {/* Hexagonal cyberpunk energy shield bubble */}
      {shieldActive && (
        <>
          {/* Inner Cyan Layer */}
          <mesh position={[0, 0, 0]}>
            <dodecahedronGeometry args={[0.85, 1]} />
            <meshBasicMaterial 
              color={PALETTE.neonCyan} 
              wireframe={true} 
              transparent={true} 
              opacity={0.3} 
            />
          </mesh>
          {/* Outer Pink/Magenta Layer for Double Shield */}
          {shieldStrength === 2 && (
            <mesh position={[0, 0, 0]}>
              <dodecahedronGeometry args={[0.95, 1]} />
              <meshBasicMaterial 
                color={PALETTE.hotPink} 
                wireframe={true} 
                transparent={true} 
                opacity={0.2} 
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

// Flickering engine plume helper component supporting single, twin, and triple flames
interface EngineFlameProps {
  color: string;
  flameType: 'SINGLE' | 'TWIN' | 'TRIPLE';
}

function EngineFlame({ color, flameType }: EngineFlameProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { boostActive } = useGameStore.getState();

    // Animate scale of the thruster flame to look reactive/flickering, extra large during boost
    const baseScale = boostActive ? 2.5 : 1.0;
    const flickerSpeed = boostActive ? 80 : 45;
    const scaleYFactor = baseScale * (boostActive ? 3.0 : 1.8) + Math.sin(state.clock.getElapsedTime() * flickerSpeed) * 0.15;
    const scaleXZFactor = baseScale + Math.sin(state.clock.getElapsedTime() * (flickerSpeed + 5)) * 0.08;

    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.scale.set(scaleXZFactor, scaleYFactor, scaleXZFactor);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (boostActive) {
          mat.color.setStyle(PALETTE.neonYellow);
        } else {
          mat.color.setStyle(color);
        }
      }
    });
  });

  if (flameType === 'TWIN') {
    // Twin engine flames
    return (
      <group ref={groupRef}>
        <mesh position={[-0.08, -0.22, 0]}>
          <coneGeometry args={[0.04, 0.35, 5]} />
          <meshBasicMaterial color={color} transparent={true} opacity={0.95} />
        </mesh>
        <mesh position={[0.08, -0.22, 0]}>
          <coneGeometry args={[0.04, 0.35, 5]} />
          <meshBasicMaterial color={color} transparent={true} opacity={0.95} />
        </mesh>
      </group>
    );
  }

  if (flameType === 'TRIPLE') {
    // Triple engine flames
    return (
      <group ref={groupRef}>
        <mesh position={[-0.08, -0.22, -0.02]}>
          <coneGeometry args={[0.035, 0.3, 5]} />
          <meshBasicMaterial color={color} transparent={true} opacity={0.95} />
        </mesh>
        <mesh position={[0, -0.22, 0.02]}>
          <coneGeometry args={[0.045, 0.35, 5]} />
          <meshBasicMaterial color={color} transparent={true} opacity={0.95} />
        </mesh>
        <mesh position={[0.08, -0.22, -0.02]}>
          <coneGeometry args={[0.035, 0.3, 5]} />
          <meshBasicMaterial color={color} transparent={true} opacity={0.95} />
        </mesh>
      </group>
    );
  }

  // Single engine flame
  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.22, 0]}>
        <coneGeometry args={[0.08, 0.35, 5]} />
        <meshBasicMaterial color={color} transparent={true} opacity={0.95} />
      </mesh>
    </group>
  );
}
