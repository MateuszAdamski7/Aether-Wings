import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';
import type { ShipSkinProps } from '../skinsVisuals';

const boxGeomQuantum = new THREE.BoxGeometry(0.26, 0.05, 0.2);
const absorbQuantumGeom = new THREE.BoxGeometry(0.42, 0.22, 1.4);

export const QuantumShip = ({
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
          <boxGeometry args={[0.42, 0.22, 1.4]} />
          <meshStandardMaterial color={PALETTE.darkSlate} roughness={0.85} metalness={0.15} flatShading={true} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.43, 0.23, 1.42]} />
          <meshBasicMaterial color={PALETTE.quantumCyan} wireframe={true} transparent={true} opacity={0.25} />
        </mesh>
      </group>

      {/* Canopy */}
      <mesh ref={canopyRef} position={[0, 0.12, 0.25]} geometry={boxGeomQuantum}>
        <meshStandardMaterial color={PALETTE.crimsonRed} emissive={PALETTE.crimsonRed} emissiveIntensity={1.8} />
      </mesh>

      {/* Left Wing */}
      <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
        <mesh rotation={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.75, 0.06, 0.38]} />
          <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} metalness={0.2} flatShading={true} />
        </mesh>
        <group position={[-0.42, 0.04, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.24, 0.26]} />
            <meshStandardMaterial color={PALETTE.blackSlate} roughness={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.09, 0.26, 0.28]} />
            <meshBasicMaterial color={PALETTE.quantumCyan} wireframe={true} />
          </mesh>
        </group>
      </group>

      {/* Right Wing */}
      <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
        <mesh rotation={[0, -0.35, 0]} castShadow>
          <boxGeometry args={[0.75, 0.06, 0.38]} />
          <meshStandardMaterial color={PALETTE.charcoal} roughness={0.8} metalness={0.2} flatShading={true} />
        </mesh>
        <group position={[0.42, 0.04, 0.1]}>
          <mesh castShadow>
            <boxGeometry args={[0.08, 0.24, 0.26]} />
            <meshStandardMaterial color={PALETTE.blackSlate} roughness={0.5} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.09, 0.26, 0.28]} />
            <meshBasicMaterial color={PALETTE.quantumCyan} wireframe={true} />
          </mesh>
        </group>
      </group>

      {/* Nozzle */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        <group>
          <mesh position={[-0.08, 0, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.2]} />
            <meshStandardMaterial color={PALETTE.slate} roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[0.08, 0, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.2]} />
            <meshStandardMaterial color={PALETTE.slate} roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      </group>

      {/* Full-ship wireframe absorb outline */}
      <group ref={absorbMeshRef} visible={false}>
        {/* Fuselage Outline */}
        <mesh>
          <primitive object={absorbQuantumGeom} attach="geometry" />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Canopy Outline */}
        <mesh position={[0, 0.12, 0.25]} geometry={boxGeomQuantum}>
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        {/* Wings Outlines */}
        <mesh position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <boxGeometry args={[0.75, 0.06, 0.38]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
        <mesh position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <boxGeometry args={[0.75, 0.06, 0.38]} />
          <meshBasicMaterial color="#00f3ff" transparent={true} opacity={0} wireframe={true} />
        </mesh>
      </group>
    </>
  );
};
