import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const boxGeomPink = new THREE.BoxGeometry(0.14, 0.08, 0.4);
const absorbPinkGeom = new THREE.ConeGeometry(0.26, 1.5, 4);

export const PinkShip = ({
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
        <mesh castShadow>
          <coneGeometry args={[0.26, 1.5, 4]} />
          <meshStandardMaterial color={PALETTE.pinkSilver} roughness={0.15} metalness={0.95} flatShading={true} />
        </mesh>
        <mesh position={[0, 0.05, 0.1]}>
          <boxGeometry args={[0.08, 0.04, 0.8]} />
          <meshStandardMaterial color={PALETTE.neonPink} emissive={PALETTE.neonPink} emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.1, 0.1]} geometry={boxGeomPink}>
        <meshStandardMaterial color={PALETTE.neonPink} emissive={PALETTE.neonPink} emissiveIntensity={1.2} transparent={true} opacity={0.7} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.04, 0.4]} />
          <meshStandardMaterial color={PALETTE.darkPink} roughness={0.2} metalness={0.8} flatShading={true} />
        </mesh>
        <mesh position={[-0.38, 0, 0.05]}>
          <boxGeometry args={[0.03, 0.06, 0.42]} />
          <meshBasicMaterial color={PALETTE.neonPink} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.04, 0.4]} />
          <meshStandardMaterial color={PALETTE.darkPink} roughness={0.2} metalness={0.8} flatShading={true} />
        </mesh>
        <mesh position={[0.38, 0, 0.05]}>
          <boxGeometry args={[0.03, 0.06, 0.42]} />
          <meshBasicMaterial color={PALETTE.neonPink} />
        </mesh>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.12, 0.15, 0.25, 6]} />
          <meshStandardMaterial color={PALETTE.darkPink} metalness={0.9} />
        </mesh>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <mesh>
          <primitive object={absorbPinkGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.1, 0.1]} geometry={boxGeomPink}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.75, 0.04, 0.4]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.75, 0.04, 0.4]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
