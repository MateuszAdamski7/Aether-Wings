import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const sphereGeomVortex = new THREE.SphereGeometry(0.13, 16, 16);
const absorbVortexGeom = new THREE.CylinderGeometry(0.04, 0.04, 1.8, 8);

export const VortexShip = ({
  fuselageRef,
  canopyRef,
  leftWingRef,
  rightWingRef,
  nozzleRef,
  absorbMeshRef,
  vortexCoreRef
}: ShipSkinProps) => {
  return (
    <>
      {/* Fuselage */}
      <group ref={fuselageRef}>
        <mesh castShadow>
          <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
          <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} flatShading={true} />
        </mesh>
        <mesh position={[0, -0.2, 0]}>
          <cylinderGeometry args={[0.16, 0.16, 0.5, 6]} />
          <meshBasicMaterial color={PALETTE.magenta} wireframe={true} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.14, 0.1]} geometry={sphereGeomVortex}>
        <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.magenta} emissiveIntensity={1.2} transparent={true} opacity={0.65} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh rotation={[0, 0, 0]} castShadow>
          <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
          <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, 0]}>
          <torusGeometry args={[0.64, 0.01, 4, 32, Math.PI]} />
          <meshBasicMaterial color={PALETTE.magenta} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh rotation={[0, 0, Math.PI]} castShadow>
          <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
          <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.64, 0.01, 4, 32, Math.PI]} />
          <meshBasicMaterial color={PALETTE.magenta} />
        </mesh>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <cylinderGeometry args={[0.06, 0.1, 0.2, 8]} />
          <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} />
        </mesh>
      </group>

      {/* Extra Visuals: Vortex Singularity Core */}
      <group ref={vortexCoreRef} position={[0, 0.22, 0]}>
        <mesh>
          <dodecahedronGeometry args={[0.22, 0]} />
          <meshBasicMaterial color={PALETTE.neonCyan} wireframe={true} transparent={true} opacity={0.8} />
        </mesh>
        <mesh>
          <sphereGeometry args={[0.09, 8, 8]} />
          <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.magenta} emissiveIntensity={2.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.25, 0.02, 6, 16]} />
          <meshBasicMaterial color={PALETTE.magenta} transparent={true} opacity={0.6} />
        </mesh>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <mesh>
          <primitive object={absorbVortexGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.14, 0.1]} geometry={sphereGeomVortex}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Left Wing Outline */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Right Wing Outline */}
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]} rotation-y={Math.PI}>
          <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
