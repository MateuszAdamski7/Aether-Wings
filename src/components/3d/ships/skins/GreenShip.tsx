import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const boxGeomGreen = new THREE.BoxGeometry(0.18, 0.03, 0.16);
const absorbGreenGeom = new THREE.SphereGeometry(0.22, 8, 8);

export const GreenShip = ({
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
          <sphereGeometry args={[0.22, 8, 8]} scale={[1, 0.6, 2.8]} />
          <meshStandardMaterial color={PALETTE.darkGreen} roughness={0.75} metalness={0.1} flatShading={true} />
        </mesh>
        <mesh position={[0, 0.06, 0.4]}>
          <sphereGeometry args={[0.05, 5, 5]} />
          <meshStandardMaterial color={PALETTE.neonGreen} emissive={PALETTE.neonGreen} emissiveIntensity={1.5} />
        </mesh>
        <mesh position={[0, 0.06, -0.4]}>
          <sphereGeometry args={[0.05, 5, 5]} />
          <meshStandardMaterial color={PALETTE.neonGreen} emissive={PALETTE.neonGreen} emissiveIntensity={1.5} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.09, 0.2]} geometry={boxGeomGreen}>
        <meshStandardMaterial color={PALETTE.neonGreen} emissive={PALETTE.neonGreen} emissiveIntensity={2.0} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <coneGeometry args={[0.1, 0.8, 3]} />
          <meshStandardMaterial color={PALETTE.deepGreen} roughness={0.8} metalness={0.05} flatShading={true} />
        </mesh>
        <mesh position={[-0.1, 0, 0.05]}>
          <boxGeometry args={[0.4, 0.01, 0.04]} />
          <meshBasicMaterial color={PALETTE.neonGreen} />
        </mesh>
        <mesh position={[-0.4, 0, -0.1]} rotation={[0, 0.5, 0]}>
          <coneGeometry args={[0.03, 0.35, 3]} />
          <meshStandardMaterial color={PALETTE.neonGreen} emissive={PALETTE.neonGreen} emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.1, 0.8, 3]} />
          <meshStandardMaterial color={PALETTE.deepGreen} roughness={0.8} metalness={0.05} flatShading={true} />
        </mesh>
        <mesh position={[0.1, 0, 0.05]}>
          <boxGeometry args={[0.4, 0.01, 0.04]} />
          <meshBasicMaterial color={PALETTE.neonGreen} />
        </mesh>
        <mesh position={[0.4, 0, -0.1]} rotation={[0, -0.5, 0]}>
          <coneGeometry args={[0.03, 0.35, 3]} />
          <meshStandardMaterial color={PALETTE.neonGreen} emissive={PALETTE.neonGreen} emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={PALETTE.darkGreen} roughness={0.9} />
        </mesh>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <mesh scale={[1, 0.6, 2.8]}>
          <primitive object={absorbGreenGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.09, 0.2]} geometry={boxGeomGreen}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]} rotation-y={Math.PI / 2}>
          <coneGeometry args={[0.1, 0.8, 3]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]} rotation-y={-Math.PI / 2}>
          <coneGeometry args={[0.1, 0.8, 3]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
