import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const octahedronGeomPurple = new THREE.OctahedronGeometry(0.08);
const absorbPurpleGeom = new THREE.OctahedronGeometry(0.22);

export const PurpleShip = ({
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
          <octahedronGeometry args={[0.22]} scale={[1, 0.8, 3.8]} />
          <meshStandardMaterial color={PALETTE.darkPurple} roughness={0.05} metalness={0.95} flatShading={true} />
        </mesh>
        <mesh position={[0, 0.06, 0]}>
          <boxGeometry args={[0.02, 0.02, 1.2]} />
          <meshStandardMaterial color={PALETTE.voidPurple} emissive={PALETTE.voidPurple} emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.1, 0.15]} scale={[1, 0.8, 1.8]} geometry={octahedronGeomPurple}>
        <meshStandardMaterial color={PALETTE.voidPurple} emissive={PALETTE.voidPurple} emissiveIntensity={1.6} transparent={true} opacity={0.6} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.02, 0.36]} />
          <meshStandardMaterial color={PALETTE.darkPurple} roughness={0.1} metalness={0.9} flatShading={true} />
        </mesh>
        <group position={[-0.38, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.12, 0.015, 6, 12]} />
            <meshBasicMaterial color={PALETTE.voidPurple} wireframe={true} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.voidPurple} emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.8, 0.02, 0.36]} />
          <meshStandardMaterial color={PALETTE.darkPurple} roughness={0.1} metalness={0.9} flatShading={true} />
        </mesh>
        <group position={[0.38, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <mesh>
            <torusGeometry args={[0.12, 0.015, 6, 12]} />
            <meshBasicMaterial color={PALETTE.voidPurple} wireframe={true} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.03, 6, 6]} />
            <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.voidPurple} emissiveIntensity={2.0} />
          </mesh>
        </group>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <group>
          <mesh position={[-0.06, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 6]} />
            <meshStandardMaterial color={PALETTE.deepPurple} metalness={0.9} />
          </mesh>
          <mesh position={[0.06, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 6]} />
            <meshStandardMaterial color={PALETTE.deepPurple} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <mesh scale={[1, 0.8, 3.8]}>
          <primitive object={absorbPurpleGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.1, 0.15]} scale={[1, 0.8, 1.8]} geometry={octahedronGeomPurple}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.8, 0.02, 0.36]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.8, 0.02, 0.36]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
