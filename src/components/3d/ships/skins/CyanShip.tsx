import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const cylinderGeomCyan = new THREE.CylinderGeometry(0.07, 0.07, 0.5, 12);
const absorbCyanGeom = new THREE.ConeGeometry(0.07, 1.4, 5);

export const CyanShip = ({
  fuselageRef,
  canopyRef,
  leftWingRef,
  rightWingRef,
  nozzleRef,
  absorbMeshRef
}: ShipSkinProps) => {
  return (
    <>
      {/* Fuselage */}
      <group ref={fuselageRef}>
        <mesh position={[-0.09, 0, 0.1]} castShadow>
          <coneGeometry args={[0.07, 1.4, 5]} />
          <meshStandardMaterial color={PALETTE.darkCyan} roughness={0.1} metalness={0.85} flatShading={true} />
        </mesh>
        <mesh position={[0.09, 0, 0.1]} castShadow>
          <coneGeometry args={[0.07, 1.4, 5]} />
          <meshStandardMaterial color={PALETTE.darkCyan} roughness={0.1} metalness={0.85} flatShading={true} />
        </mesh>
        <mesh position={[0, -0.04, -0.2]} castShadow>
          <boxGeometry args={[0.22, 0.08, 0.6]} />
          <meshStandardMaterial color={PALETTE.deepCyan} roughness={0.3} metalness={0.7} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.05, 0.02, 0.9]} />
          <meshStandardMaterial color={PALETTE.neonCyan} emissive={PALETTE.neonCyan} emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.08, 0.0]} rotation={[Math.PI / 2, 0, 0]} geometry={cylinderGeomCyan}>
        <meshStandardMaterial color={PALETTE.neonCyan} emissive={PALETTE.neonCyan} emissiveIntensity={1.5} transparent={true} opacity={0.75} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.03, 0.3]} />
          <meshStandardMaterial color={PALETTE.darkCyan} roughness={0.1} metalness={0.85} flatShading={true} />
        </mesh>
        <mesh position={[-0.1, 0.02, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.06]} />
          <meshBasicMaterial color={PALETTE.neonCyan} />
        </mesh>
        <mesh position={[-0.4, 0, -0.05]} rotation={[Math.PI / 2, 0.2, 0]}>
          <coneGeometry args={[0.04, 0.3, 4]} />
          <meshStandardMaterial color={PALETTE.neonCyan} emissive={PALETTE.neonCyan} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.03, 0.3]} />
          <meshStandardMaterial color={PALETTE.darkCyan} roughness={0.1} metalness={0.85} flatShading={true} />
        </mesh>
        <mesh position={[0.1, 0.02, 0]}>
          <boxGeometry args={[0.5, 0.01, 0.06]} />
          <meshBasicMaterial color={PALETTE.neonCyan} />
        </mesh>
        <mesh position={[0.4, 0, -0.05]} rotation={[Math.PI / 2, -0.2, 0]}>
          <coneGeometry args={[0.04, 0.3, 4]} />
          <meshStandardMaterial color={PALETTE.neonCyan} emissive={PALETTE.neonCyan} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <group>
          <mesh position={[-0.08, 0, -0.02]}>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
            <meshStandardMaterial color={PALETTE.teal} metalness={0.8} />
          </mesh>
          <mesh position={[0, 0, 0.02]}>
            <cylinderGeometry args={[0.05, 0.07, 0.2, 6]} />
            <meshStandardMaterial color={PALETTE.teal} metalness={0.8} />
          </mesh>
          <mesh position={[0.08, 0, -0.02]}>
            <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
            <meshStandardMaterial color={PALETTE.teal} metalness={0.8} />
          </mesh>
        </group>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <group>
          <mesh position={[-0.09, 0, 0.1]}>
            <primitive object={absorbCyanGeom} attach="geometry" />
            <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
          </mesh>
          <mesh position={[0.09, 0, 0.1]}>
            <primitive object={absorbCyanGeom} attach="geometry" />
            <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
          </mesh>
        </group>
        {/* Canopy Outline */}
        <mesh position={[0, 0.08, 0.0]} rotation={[Math.PI / 2, 0, 0]} geometry={cylinderGeomCyan}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.8, 0.03, 0.3]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.8, 0.03, 0.3]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
