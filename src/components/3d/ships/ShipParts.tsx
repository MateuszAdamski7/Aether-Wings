import type { RefObject } from 'react';
import * as THREE from 'three';
import { PALETTE } from '../../../config/gameConfig';

// ==========================================
// 1. FUSELAGE MODEL FACTORY
// ==========================================

export function FuselageModel({ skinId }: { skinId: string }) {
  switch (skinId) {
    case 'vortex':
      return (
        <>
          {/* Vortex Singelage: Sleek chrome needle core */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
            <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} flatShading={true} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.5, 6]} />
            <meshBasicMaterial color={PALETTE.magenta} wireframe={true} />
          </mesh>
        </>
      );

    case 'quantum':
      return (
        <>
          {/* Quantum Heavy Blocky Visor Fuselage */}
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.22, 1.4]} />
            <meshStandardMaterial color={PALETTE.darkSlate} roughness={0.85} metalness={0.15} flatShading={true} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.43, 0.23, 1.42]} />
            <meshBasicMaterial color={PALETTE.quantumCyan} wireframe={true} transparent={true} opacity={0.25} />
          </mesh>
        </>
      );

    case 'temporal':
      return (
        <>
          {/* Temporal Twin-needle Nose & Frame */}
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
        </>
      );

    case 'pink':
      return (
        <>
          {/* Laser Pink wedge hull */}
          <mesh castShadow>
            <coneGeometry args={[0.26, 1.5, 4]} />
            <meshStandardMaterial color={PALETTE.pinkSilver} roughness={0.15} metalness={0.95} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.05, 0.1]}>
            <boxGeometry args={[0.08, 0.04, 0.8]} />
            <meshStandardMaterial color={PALETTE.neonPink} emissive={PALETTE.neonPink} emissiveIntensity={0.8} />
          </mesh>
        </>
      );

    case 'cyan':
      return (
        <>
          {/* Cyan Flare Split Racer Nose */}
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
        </>
      );

    case 'yellow':
      return (
        <>
          {/* Solar Yellow Hexagonal Body */}
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1.4, 6]} />
            <meshStandardMaterial color={PALETTE.neonYellow} roughness={0.3} metalness={0.5} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.08, -0.1]} castShadow>
            <boxGeometry args={[0.22, 0.08, 0.9]} />
            <meshStandardMaterial color={PALETTE.darkGold} roughness={0.7} metalness={0.3} />
          </mesh>
        </>
      );

    case 'green':
      return (
        <>
          {/* Acid Green Organic shell carapace */}
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
        </>
      );

    case 'purple':
      return (
        <>
          {/* Nebula Violet Diamond Hull */}
          <mesh castShadow>
            <octahedronGeometry args={[0.22]} scale={[1, 0.8, 3.8]} />
            <meshStandardMaterial color={PALETTE.darkPurple} roughness={0.05} metalness={0.95} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.02, 0.02, 1.2]} />
            <meshStandardMaterial color={PALETTE.voidPurple} emissive={PALETTE.voidPurple} emissiveIntensity={1.2} />
          </mesh>
        </>
      );

    default:
      return (
        /* Fallback Fuselage */
        <mesh castShadow>
          <coneGeometry args={[0.3, 1.6, 5]} />
          <meshStandardMaterial 
            color="#121225" 
            roughness={0.2}
            metalness={0.8}
            flatShading={true}
          />
        </mesh>
      );
  }
}

// ==========================================
// 2. CANOPY MODEL FACTORY
// ==========================================

export function CanopyModel({ skinId }: { skinId: string }) {
  switch (skinId) {
    case 'vortex':
      return (
        <meshStandardMaterial color={PALETTE.white} emissive={PALETTE.magenta} emissiveIntensity={1.2} transparent={true} opacity={0.65} />
      );
    case 'quantum':
      return (
        <meshStandardMaterial color={PALETTE.crimsonRed} emissive={PALETTE.crimsonRed} emissiveIntensity={1.8} />
      );
    case 'temporal':
      return (
        <meshStandardMaterial color={PALETTE.s2Hazard} emissive={PALETTE.neonYellow} emissiveIntensity={1.0} transparent={true} opacity={0.7} />
      );
    case 'pink':
      return (
        <meshStandardMaterial color={PALETTE.neonPink} emissive={PALETTE.neonPink} emissiveIntensity={1.2} transparent={true} opacity={0.7} />
      );
    case 'cyan':
      return (
        <meshStandardMaterial color={PALETTE.neonCyan} emissive={PALETTE.neonCyan} emissiveIntensity={1.5} transparent={true} opacity={0.75} />
      );
    case 'yellow':
      return (
        <meshStandardMaterial color={PALETTE.s2Hazard} emissive={PALETTE.neonYellow} emissiveIntensity={0.8} transparent={true} opacity={0.7} />
      );
    case 'green':
      return (
        <meshStandardMaterial color={PALETTE.neonGreen} emissive={PALETTE.neonGreen} emissiveIntensity={2.0} />
      );
    case 'purple':
      return (
        <meshStandardMaterial color={PALETTE.voidPurple} emissive={PALETTE.voidPurple} emissiveIntensity={1.6} transparent={true} opacity={0.6} />
      );
    default:
      return (
        <meshStandardMaterial 
          color={PALETTE.neonCyan} 
          emissive={PALETTE.neonCyan} 
          emissiveIntensity={0.6}
          transparent={true}
          opacity={0.8}
        />
      );
  }
}

// ==========================================
// 3. LEFT WING MODEL FACTORY
// ==========================================

export function LeftWingModel({ skinId, leftChronoRingRef }: { skinId: string; leftChronoRingRef: RefObject<THREE.Mesh | null> }) {
  switch (skinId) {
    case 'vortex':
      return (
        <>
          {/* Vortex Split Orbital Disc Wing (Left Half) */}
          <mesh rotation={[0, 0, 0]} castShadow>
            <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
            <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.64, 0.01, 4, 32, Math.PI]} />
            <meshBasicMaterial color={PALETTE.magenta} />
          </mesh>
        </>
      );

    case 'quantum':
      return (
        <>
          {/* Quantum Heavy Forward swept Wing */}
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
        </>
      );

    case 'temporal':
      return (
        <>
          {/* Temporal Chrono Wing & Spinning Ring */}
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
        </>
      );

    case 'pink':
      return (
        <>
          {/* Laser Pink Left Wing */}
          <mesh castShadow>
            <boxGeometry args={[0.75, 0.04, 0.4]} />
            <meshStandardMaterial color={PALETTE.darkPink} roughness={0.2} metalness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[-0.38, 0, 0.05]}>
            <boxGeometry args={[0.03, 0.06, 0.42]} />
            <meshBasicMaterial color={PALETTE.neonPink} />
          </mesh>
        </>
      );

    case 'cyan':
      return (
        <>
          {/* Cyan Flare Left Wing */}
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
        </>
      );

    case 'yellow':
      return (
        <>
          {/* Solar Yellow Left Wing solar panel */}
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
        </>
      );

    case 'green':
      return (
        <>
          {/* Acid Green Organic left claw wing */}
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
        </>
      );

    case 'purple':
      return (
        <>
          {/* Nebula Violet Left Wing with gravity-well */}
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
        </>
      );

    default:
      return (
        /* Fallback Left Wing */
        <>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.05, 0.5]} />
            <meshStandardMaterial 
              color={PALETTE.darkBlue} 
              roughness={0.3} 
              metalness={0.7} 
              flatShading={true}
            />
          </mesh>
          <mesh position={[-0.4, 0.0, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.52]} />
            <meshBasicMaterial color={PALETTE.neonCyan} />
          </mesh>
        </>
      );
  }
}

// ==========================================
// 4. RIGHT WING MODEL FACTORY
// ==========================================

export function RightWingModel({ skinId, rightChronoRingRef }: { skinId: string; rightChronoRingRef: RefObject<THREE.Mesh | null> }) {
  switch (skinId) {
    case 'vortex':
      return (
        <>
          {/* Vortex Split Orbital Disc Wing (Right Half) */}
          <mesh rotation={[0, 0, Math.PI]} castShadow>
            <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
            <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.64, 0.01, 4, 32, Math.PI]} />
            <meshBasicMaterial color={PALETTE.magenta} />
          </mesh>
        </>
      );

    case 'quantum':
      return (
        <>
          {/* Quantum Heavy Forward swept Wing */}
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
        </>
      );

    case 'temporal':
      return (
        <>
          {/* Temporal Chrono Wing & Spinning Ring */}
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
        </>
      );

    case 'pink':
      return (
        <>
          {/* Laser Pink Right Wing */}
          <mesh castShadow>
            <boxGeometry args={[0.75, 0.04, 0.4]} />
            <meshStandardMaterial color={PALETTE.darkPink} roughness={0.2} metalness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[0.38, 0, 0.05]}>
            <boxGeometry args={[0.03, 0.06, 0.42]} />
            <meshBasicMaterial color={PALETTE.neonPink} />
          </mesh>
        </>
      );

    case 'cyan':
      return (
        <>
          {/* Cyan Flare Right Wing */}
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
        </>
      );

    case 'yellow':
      return (
        <>
          {/* Solar Yellow Right Wing solar panel */}
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
        </>
      );

    case 'green':
      return (
        <>
          {/* Acid Green Organic right claw wing */}
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
        </>
      );

    case 'purple':
      return (
        <>
          {/* Nebula Violet Right Wing with gravity-well */}
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
        </>
      );

    default:
      return (
        /* Fallback Right Wing */
        <>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.05, 0.5]} />
            <meshStandardMaterial 
              color={PALETTE.darkBlue} 
              roughness={0.3} 
              metalness={0.7} 
              flatShading={true}
            />
          </mesh>
          <mesh position={[0.4, 0.0, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.52]} />
            <meshBasicMaterial color={PALETTE.hotPink} />
          </mesh>
        </>
      );
  }
}

// ==========================================
// 5. ENGINE NOZZLE MODEL FACTORY
// ==========================================

export function NozzleModel({ skinId }: { skinId: string }) {
  switch (skinId) {
    case 'vortex':
      return (
        <mesh>
          <cylinderGeometry args={[0.06, 0.1, 0.2, 8]} />
          <meshStandardMaterial color={PALETTE.grayText} roughness={0.1} metalness={0.9} />
        </mesh>
      );

    case 'quantum':
      return (
        <group>
          {/* Double square exhaust ports */}
          <mesh position={[-0.08, 0, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.2]} />
            <meshStandardMaterial color={PALETTE.slate} roughness={0.7} metalness={0.3} />
          </mesh>
          <mesh position={[0.08, 0, 0]}>
            <boxGeometry args={[0.1, 0.12, 0.2]} />
            <meshStandardMaterial color={PALETTE.slate} roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      );

    case 'temporal':
      return (
        <mesh rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.08, 0.25, 6]} />
          <meshStandardMaterial color={PALETTE.goldUpgrade} roughness={0.2} metalness={0.8} />
        </mesh>
      );

    case 'cyan':
      return (
        <group>
          {/* Triple circular thrusters */}
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
      );

    case 'yellow':
      return (
        <mesh>
          <boxGeometry args={[0.2, 0.2, 0.18]} />
          <meshStandardMaterial color={PALETTE.goldMuted} roughness={0.4} metalness={0.6} />
        </mesh>
      );

    case 'green':
      return (
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={PALETTE.darkGreen} roughness={0.9} />
        </mesh>
      );

    case 'purple':
      return (
        <group>
          {/* Twin round exhaust ports */}
          <mesh position={[-0.06, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 6]} />
            <meshStandardMaterial color={PALETTE.deepPurple} metalness={0.9} />
          </mesh>
          <mesh position={[0.06, 0, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 0.22, 6]} />
            <meshStandardMaterial color={PALETTE.deepPurple} metalness={0.9} />
          </mesh>
        </group>
      );

    default:
      /* Laser Pink / Default single circular thruster */
      return (
        <mesh>
          <cylinderGeometry args={[0.12, 0.15, 0.25, 6]} />
          <meshStandardMaterial color={PALETTE.darkPink} metalness={0.9} />
        </mesh>
      );
  }
}
