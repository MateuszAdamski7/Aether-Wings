import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const boxGeomDefault = new THREE.BoxGeometry(0.16, 0.12, 0.5);
const absorbDefaultGeom = new THREE.ConeGeometry(0.3, 1.6, 5);

export const DefaultShip = ({
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
          <coneGeometry args={[0.3, 1.6, 5]} />
          <meshStandardMaterial color="#121225" roughness={0.2} metalness={0.8} flatShading={true} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.1, 0.1]} geometry={boxGeomDefault}>
        <meshStandardMaterial color={PALETTE.neonCyan} emissive={PALETTE.neonCyan} emissiveIntensity={0.6} transparent={true} opacity={0.8} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.05, 0.5]} />
          <meshStandardMaterial color={PALETTE.darkBlue} roughness={0.3} metalness={0.7} flatShading={true} />
        </mesh>
        <mesh position={[-0.4, 0.0, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.52]} />
          <meshBasicMaterial color={PALETTE.neonCyan} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.05, 0.5]} />
          <meshStandardMaterial color={PALETTE.darkBlue} roughness={0.3} metalness={0.7} flatShading={true} />
        </mesh>
        <mesh position={[0.4, 0.0, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.52]} />
          <meshBasicMaterial color={PALETTE.hotPink} />
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
          <primitive object={absorbDefaultGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.1, 0.1]} geometry={boxGeomDefault}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.8, 0.05, 0.5]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.8, 0.05, 0.5]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
