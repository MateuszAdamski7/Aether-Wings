import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../../../../store/useGameStore';
import * as THREE from 'three';
import { PALETTE } from '../../../../config/gameConfig';

interface ShipAnimationRefs {
  meshRef: React.RefObject<THREE.Group | null>;
  fuselageRef: React.RefObject<THREE.Group | null>;
  canopyRef: React.RefObject<THREE.Mesh | null>;
  leftWingRef: React.RefObject<THREE.Group | null>;
  rightWingRef: React.RefObject<THREE.Group | null>;
  nozzleRef: React.RefObject<THREE.Group | null>;
  absorbMeshRef: React.RefObject<THREE.Group | null>;
  blastMeshRef: React.RefObject<THREE.Mesh | null>;
  
  // Specific features refs
  leftChronoRingRef?: React.RefObject<THREE.Mesh | null>;
  rightChronoRingRef?: React.RefObject<THREE.Mesh | null>;
  vortexCoreRef?: React.RefObject<THREE.Group | null>;
}

export function useShipAnimations(
  {
    meshRef,
    fuselageRef,
    canopyRef,
    leftWingRef,
    rightWingRef,
    nozzleRef,
    absorbMeshRef,
    blastMeshRef,
    leftChronoRingRef,
    rightChronoRingRef,
    vortexCoreRef
  }: ShipAnimationRefs,
  underglowColor: string
) {
  const collisionTime = useRef(0);
  const gapProgress = useRef(0);
  
  // Subtle crystal absorption refs
  const lastCount = useRef(useGameStore.getState().crystalCount);
  const absorbColor = useRef('#00f3ff');
  const absorbTime = useRef(0);
  const absorbDelay = useRef(0);
  const pendingAbsorbColor = useRef('#00f3ff');

  const collisionTriggered = useGameStore((state) => state.collisionTriggered);

  useFrame((state, delta) => {
    // Read state non-reactively inside frame loop
    const { boostActive, slowMoActiveTime, boostTimeRemaining, crystalCount, crystals, playerZ } = useGameStore.getState();

    // Limit delta to avoid huge physics jumps on frame lag. Scale by 0.65 during slow-mo.
    const dt = Math.min(delta, 0.1) * (slowMoActiveTime > 0 ? 0.65 : 1.0);

    if (!collisionTriggered) {
      collisionTime.current = 0;
      
      // 1. TRANSFORMATION PARTS GAP INTERPOLATION (Boost active separation)
      if (boostActive) {
        if (boostTimeRemaining > 1.0) {
          // Smoothly open parts gap
          gapProgress.current = THREE.MathUtils.lerp(gapProgress.current, 1.0, dt * 2.8);
        } else {
          // Smoothly close parts gap to reach exactly 0.0 at the end of the boost
          gapProgress.current = Math.max(0.0, boostTimeRemaining);
        }
      } else {
        // Normal flight: ensure gap is closed
        gapProgress.current = THREE.MathUtils.lerp(gapProgress.current, 0.0, dt * 2.8);
      }
      const g = gapProgress.current;

      // Scale up the ship slightly during boost to make the parts separation feel extra premium
      const currentScale = 1.0 + g * 0.12;
      if (meshRef.current) {
        meshRef.current.scale.set(currentScale, currentScale, currentScale);
      }

      if (fuselageRef.current) {
        fuselageRef.current.position.set(0, 0, 0);
        fuselageRef.current.rotation.set(0, 0, 0);
      }
      if (canopyRef.current) {
        // Canopy slides up and forward
        canopyRef.current.position.set(0, 0.1 + g * 0.08, 0.1 + g * 0.15);
        canopyRef.current.rotation.set(0, 0, 0);
      }
      if (leftWingRef.current) {
        // Left wing slides left and back
        leftWingRef.current.position.set(-0.45 - g * 0.22, -0.05, -0.1 - g * 0.08);
        leftWingRef.current.rotation.set(0, -0.1 - g * 0.05, 0.25);
      }
      if (rightWingRef.current) {
        // Right wing slides right and back
        rightWingRef.current.position.set(0.45 + g * 0.22, -0.05, -0.1 - g * 0.08);
        rightWingRef.current.rotation.set(0, 0.1 + g * 0.05, -0.25);
      }
      if (nozzleRef.current) {
        // Engine nozzle slides backward
        nozzleRef.current.position.set(0, -0.05, -0.85 - g * 0.22);
        nozzleRef.current.rotation.set(Math.PI / 2, 0, 0);
      }
    } else {
      // 2. DISINTEGRATION SIMULATION (Newtonian Physics Explosion + Floor Impact)
      collisionTime.current += dt;
      const t = collisionTime.current;
      const gravity = -9.8; // real gravity
      
      // Decay factor for horizontal/rotational speeds due to friction
      const spinDecay = Math.max(0, Math.exp(-t * 2.2));

      // The track floor level clamp relative to group pivot
      const relativeFloor = -0.28;

      // Central Body (Fuselage)
      if (fuselageRef.current) {
        let y = 1.2 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        fuselageRef.current.position.y = y;
        fuselageRef.current.position.z = -2.5 * (1.0 - Math.exp(-t * 2.0));
        fuselageRef.current.rotation.x = t * 3.5 * spinDecay;
        fuselageRef.current.rotation.y = t * 1.8 * spinDecay;
        fuselageRef.current.rotation.z = t * 1.0 * spinDecay;
      }

      // Cockpit Canopy
      if (canopyRef.current) {
        let y = 0.1 + 4.5 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        canopyRef.current.position.y = y;
        canopyRef.current.position.x = 0.25 * (1.0 - Math.exp(-t * 2.0));
        canopyRef.current.position.z = 0.1 + 1.2 * (1.0 - Math.exp(-t * 2.0));
        canopyRef.current.rotation.x = t * 7.5 * spinDecay;
        canopyRef.current.rotation.y = t * 4.5 * spinDecay;
      }

      // Left Wing
      if (leftWingRef.current) {
        let y = -0.05 + 2.0 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        leftWingRef.current.position.y = y;
        leftWingRef.current.position.x = -0.45 - 4.5 * (1.0 - Math.exp(-t * 2.0));
        leftWingRef.current.position.z = -0.1 - 1.0 * (1.0 - Math.exp(-t * 2.0));
        leftWingRef.current.rotation.x = t * 4.5 * spinDecay;
        leftWingRef.current.rotation.y = t * 2.0 * spinDecay;
        leftWingRef.current.rotation.z = 0.25 + t * 5.5 * spinDecay;
      }

      // Right Wing
      if (rightWingRef.current) {
        let y = -0.05 + 2.0 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        rightWingRef.current.position.y = y;
        rightWingRef.current.position.x = 0.45 + 4.5 * (1.0 - Math.exp(-t * 2.0));
        rightWingRef.current.position.z = -0.1 - 1.0 * (1.0 - Math.exp(-t * 2.0));
        rightWingRef.current.rotation.x = t * -4.5 * spinDecay;
        rightWingRef.current.rotation.y = t * 2.0 * spinDecay;
        rightWingRef.current.rotation.z = -0.25 + t * -5.5 * spinDecay;
      }

      // Engine Nozzle
      if (nozzleRef.current) {
        let y = -0.05 + 0.5 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        nozzleRef.current.position.y = y;
        nozzleRef.current.position.z = -0.85 - 6.5 * (1.0 - Math.exp(-t * 2.0));
        nozzleRef.current.rotation.x = Math.PI / 2 + t * 1.5 * spinDecay;
        nozzleRef.current.rotation.y = t * 2.5 * spinDecay;
      }

      // Subtle tilt of the main parent group for crash landing
      if (meshRef.current) {
        meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0.15, dt * 2);
        meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -0.2, dt * 4);
        meshRef.current.scale.set(1.0, 1.0, 1.0);
      }
    }

    // 3. CRYSTAL ABSORB POWER-UP ANIMATION
    if (crystalCount !== lastCount.current) {
      lastCount.current = crystalCount;
      const collectedCrystal = crystals.find(c => c.collected && Math.abs(c.z - playerZ) < 6.0);
      pendingAbsorbColor.current = collectedCrystal ? collectedCrystal.color : PALETTE.neonCyan;
      absorbDelay.current = 0.26;
    }

    if (absorbDelay.current > 0) {
      absorbDelay.current -= dt;
      if (absorbDelay.current <= 0) {
        absorbColor.current = pendingAbsorbColor.current;
        absorbTime.current = 0.25;
      }
    }

    if (absorbMeshRef.current) {
      if (absorbTime.current > 0 && !collisionTriggered) {
        absorbTime.current -= dt;
        const progress = Math.max(0, absorbTime.current / 0.25);
        
        if (fuselageRef.current) {
          absorbMeshRef.current.position.copy(fuselageRef.current.position);
          absorbMeshRef.current.rotation.copy(fuselageRef.current.rotation);
        }
        
        const scale = 1.0 + progress * 0.2;
        absorbMeshRef.current.scale.set(scale, scale, scale);
        
        absorbMeshRef.current.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshBasicMaterial;
            if (mat) {
              mat.color.setStyle(absorbColor.current);
              mat.opacity = 0.55 * progress;
            }
          }
        });
        absorbMeshRef.current.visible = true;
      } else {
        absorbMeshRef.current.visible = false;
        absorbTime.current = 0;
      }
    }

    // 4. Canopy emissive pulse color and intensity (handles flash when boost is ready or active)
    if (canopyRef.current) {
      const mat = canopyRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        const { boostCharge } = useGameStore.getState();
        
        if (boostActive && !collisionTriggered) {
          mat.emissiveIntensity = 2.5;
          mat.emissive.setStyle(PALETTE.neonYellow);
        } else if (boostCharge === 10 && !collisionTriggered) {
          const pulse = Math.sin(state.clock.getElapsedTime() * 12) * 0.5 + 0.5;
          mat.emissiveIntensity = 0.6 + pulse * 1.5;
          mat.emissive.setStyle(pulse > 0.5 ? PALETTE.neonYellow : PALETTE.neonCyan);
        } else if (absorbTime.current > 0 && !collisionTriggered) {
          const progress = absorbTime.current / 0.25;
          mat.emissiveIntensity = 0.6 + progress * 2.0;
          mat.emissive.setStyle(absorbColor.current);
        } else {
          mat.emissiveIntensity = 0.6;
          mat.emissive.setStyle(underglowColor);
        }
      }
    }

    // 5. SONIC BLAST WAVE EXPANSION VISUAL
    const { blastActiveTime } = useGameStore.getState();
    if (blastMeshRef.current) {
      if (blastActiveTime > 0) {
        const progress = (0.45 - blastActiveTime) / 0.45; // 0 to 1
        const radius = progress * 24.0; // expand sphere to 24 units radius
        blastMeshRef.current.scale.set(radius, radius, radius);
        const mat = blastMeshRef.current.material as THREE.MeshBasicMaterial;
        if (mat) {
          mat.opacity = 0.8 * (1.0 - progress);
        }
        blastMeshRef.current.visible = true;
      } else {
        blastMeshRef.current.visible = false;
      }
    }

    // 6. Component rotation animations
    if (vortexCoreRef?.current) {
      vortexCoreRef.current.rotation.y += dt * 5.0;
      vortexCoreRef.current.rotation.x -= dt * 2.5;
    }
    if (leftChronoRingRef?.current) {
      leftChronoRingRef.current.rotation.z += dt * 6.0;
    }
    if (rightChronoRingRef?.current) {
      rightChronoRingRef.current.rotation.z -= dt * 6.0;
    }
  });
}
