import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const boxGeomYellow = new THREE.BoxGeometry(0.14, 0.1, 0.32);
const absorbYellowGeom = new THREE.CylinderGeometry(0.15, 0.2, 1.4, 6);

export const YellowShip = ({
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
        <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.15, 0.2, 1.4, 6]} />
          <meshStandardMaterial color={PALETTE.neonYellow} roughness={0.3} metalness={0.5} flatShading={true} />
        </mesh>
        <mesh position={[0, 0.08, -0.1]} castShadow>
          <boxGeometry args={[0.22, 0.08, 0.9]} />
          <meshStandardMaterial color={PALETTE.darkGold} roughness={0.7} metalness={0.3} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.12, 0.1]} geometry={boxGeomYellow}>
        <meshStandardMaterial color={PALETTE.s2Hazard} emissive={PALETTE.neonYellow} emissiveIntensity={0.8} transparent={true} opacity={0.7} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.06, 0.45]} />
          <meshStandardMaterial color={PALETTE.darkGold} roughness={0.85} metalness={0.1} />
        </mesh>
        <mesh position={[-0.1, 0.04, 0]}>
          <boxGeometry args={[0.42, 0.01, 0.38]} />
          <meshStandardMaterial color={PALETTE.neonYellow} roughness={0.2} metalness={0.9} flatShading={true} />
        </mesh>
        <mesh position={[-0.38, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.46]} />
          <meshStandardMaterial color={PALETTE.neonYellow} emissive={PALETTE.neonYellow} emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.75, 0.06, 0.45]} />
          <meshStandardMaterial color={PALETTE.darkGold} roughness={0.85} metalness={0.1} />
        </mesh>
        <mesh position={[0.1, 0.04, 0]}>
          <boxGeometry args={[0.42, 0.01, 0.38]} />
          <meshStandardMaterial color={PALETTE.neonYellow} roughness={0.2} metalness={0.9} flatShading={true} />
        </mesh>
        <mesh position={[0.38, 0.02, 0]}>
          <boxGeometry args={[0.04, 0.08, 0.46]} />
          <meshStandardMaterial color={PALETTE.neonYellow} emissive={PALETTE.neonYellow} emissiveIntensity={1.0} />
        </mesh>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.18]} />
          <meshStandardMaterial color={PALETTE.goldMuted} roughness={0.4} metalness={0.6} />
        </mesh>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <primitive object={absorbYellowGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.12, 0.1]} geometry={boxGeomYellow}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.75, 0.06, 0.45]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.75, 0.06, 0.45]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
