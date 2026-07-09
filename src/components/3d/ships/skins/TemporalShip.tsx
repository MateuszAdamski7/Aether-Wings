import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const sphereGeomTemporal = new THREE.SphereGeometry(0.09, 12, 12);
const absorbTemporalGeom = new THREE.ConeGeometry(0.05, 1.1, 6);

export const TemporalShip = ({
  fuselageRef,
  canopyRef,
  leftWingRef,
  rightWingRef,
  nozzleRef,
  absorbMeshRef,
  leftChronoRingRef,
  rightChronoRingRef
}: ShipSkinProps) => {
  return (
    <>
      {/* Fuselage */}
      <group ref={fuselageRef}>
        <mesh position={[-0.1, 0, 0.4]} castShadow>
          <coneGeometry args={[0.05, 1.1, 6]} />
          <meshStandardMaterial color={PALETTE.goldUpgrade} roughness={0.15} metalness={0.9} flatShading={true} />
        </mesh>
        <mesh position={[0.1, 0, 0.4]} castShadow>
          <coneGeometry args={[0.05, 1.1, 6]} />
          <meshStandardMaterial color={PALETTE.goldUpgrade} roughness={0.15} metalness={0.9} flatShading={true} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.12, 0.8]} />
          <meshStandardMaterial color={PALETTE.goldDark} roughness={0.3} metalness={0.8} flatShading={true} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.09, 0.1]} geometry={sphereGeomTemporal}>
        <meshStandardMaterial color={PALETTE.s2Hazard} emissive={PALETTE.neonYellow} emissiveIntensity={1.0} transparent={true} opacity={0.7} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.85, 0.03, 0.2]} />
          <meshStandardMaterial color={PALETTE.goldUpgrade} roughness={0.15} metalness={0.9} flatShading={true} />
        </mesh>
        <group position={[-0.42, 0.05, 0.0]}>
          <mesh ref={leftChronoRingRef}>
            <torusGeometry args={[0.18, 0.025, 6, 16]} />
            <meshBasicMaterial color={PALETTE.neonYellow} transparent={true} opacity={0.8} wireframe={true} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={PALETTE.grayDark} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh castShadow>
          <boxGeometry args={[0.85, 0.03, 0.2]} />
          <meshStandardMaterial color={PALETTE.goldUpgrade} roughness={0.15} metalness={0.9} flatShading={true} />
        </mesh>
        <group position={[0.42, 0.05, 0.0]}>
          <mesh ref={rightChronoRingRef}>
            <torusGeometry args={[0.18, 0.025, 6, 16]} />
            <meshBasicMaterial color={PALETTE.neonYellow} transparent={true} opacity={0.8} wireframe={true} />
          </mesh>
          <mesh>
            <sphereGeometry args={[0.05, 6, 6]} />
            <meshStandardMaterial color={PALETTE.grayDark} metalness={0.9} />
          </mesh>
        </group>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.25, 6]} />
          <meshStandardMaterial color={PALETTE.goldUpgrade} roughness={0.2} metalness={0.8} />
        </mesh>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <group>
          <mesh position={[-0.1, 0, 0.4]}>
            <primitive object={absorbTemporalGeom} attach="geometry" />
            <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
          </mesh>
          <mesh position={[0.1, 0, 0.4]}>
            <primitive object={absorbTemporalGeom} attach="geometry" />
            <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
          </mesh>
        </group>
        {/* Canopy Outline */}
        <mesh position={[0, 0.09, 0.1]} geometry={sphereGeomTemporal}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Left & Right Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.85, 0.03, 0.2]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.85, 0.03, 0.2]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
