import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '../store/useGameStore';
import * as THREE from 'three';

export default function Ship() {
  const meshRef = useRef<THREE.Group>(null);
  const fuselageRef = useRef<any>(null);
  const canopyRef = useRef<any>(null);
  const leftWingRef = useRef<any>(null);
  const rightWingRef = useRef<any>(null);
  const nozzleRef = useRef<any>(null);
  
  // Get game store state (only subscribe to static/rare elements to prevent React re-renders)
  const controlMode = useGameStore((state) => state.controlMode);
  const setMouseX = useGameStore((state) => state.setMouseX);
  const setShipX = useGameStore((state) => state.setShipX);
  const gameState = useGameStore((state) => state.gameState);
  const collisionTriggered = useGameStore((state) => state.collisionTriggered);
  const shieldActive = useGameStore((state) => state.shieldActive);
  const shieldStrength = useGameStore((state) => state.shieldStrength);
  const equippedSkin = useGameStore((state) => state.upgrades.equippedSkin);

  const lastPointerX = useRef(0);
  const collisionTime = useRef(0);

  // Subtle crystal absorption refs
  const absorbMeshRef = useRef<THREE.Group>(null);
  const lastCount = useRef(useGameStore.getState().crystalCount);
  const absorbColor = useRef('#00f3ff');
  const absorbTime = useRef(0);
  const absorbDelay = useRef(0);
  const pendingAbsorbColor = useRef('#00f3ff');

  // Boost transform refs
  const blastMeshRef = useRef<THREE.Mesh>(null);
  const gapProgress = useRef(0);

  // Superb ships visual component refs
  const vortexCoreRef = useRef<THREE.Group>(null);
  const leftChronoRingRef = useRef<THREE.Mesh>(null);
  const rightChronoRingRef = useRef<THREE.Mesh>(null);

  useFrame((state, delta) => {
    if (!meshRef.current) return;

    // Read fast-changing variables non-reactively from the store
    const { targetX, playerZ, boostActive, slowMoActiveTime } = useGameStore.getState();

    // Limit delta to avoid huge physics jumps on frame lag. Scale by 0.65 during slow-mo.
    const dt = Math.min(delta, 0.1) * (slowMoActiveTime > 0 ? 0.65 : 1.0);

    // 1. INPUT INTERPRETATION (Mouse tracking)
    // Check if the mouse has moved significantly (meaning the user is active with mouse)
    const currentPointerX = state.pointer.x;
    if (gameState === 'PLAYING' && !collisionTriggered) {
      const pointerDelta = Math.abs(currentPointerX - lastPointerX.current);
      // Require a larger, deliberate movement (0.06) to switch from KEYBOARD to MOUSE mode
      const threshold = controlMode === 'KEYBOARD' ? 0.06 : 0.003;
      if (pointerDelta > threshold) {
        // Map pointer [-1, 1] to track boundaries [-3.0, 3.0] (negated due to camera direction)
        setMouseX(-currentPointerX * 3.2);
        lastPointerX.current = currentPointerX;
      }
    }

    // 2. POSITION TRANSLATION (Smooth Lerp)
    // The ship Z coordinate is exactly the playerZ coordinate (moves forward)
    // The ship X coordinate lerps towards the store's targetX
    const currentX = meshRef.current.position.x;
    
    // Lerp rate changes depending on whether we are boosting (smooth center alignment) or using keyboard/mouse
    const lerpSpeed = boostActive ? 4.5 : (controlMode === 'KEYBOARD' ? 12 : 18);
    const nextX = THREE.MathUtils.lerp(currentX, targetX, dt * lerpSpeed);
    
    meshRef.current.position.x = nextX;
    meshRef.current.position.z = playerZ; // stay locked to the gameplay camera scroll
    
    // Write back the actual visual X position to the store so collision box matches perfectly
    setShipX(nextX);

    // 3. TILT & ROLL ANIMATION (Banking)
    // Roll (Z rotation) is proportional to the speed of horizontal movement
    // Yaw (Y rotation) twists slightly into the turn
    const xVelocity = nextX - currentX;
    
    // Target rotations
    const targetRoll = -xVelocity * 3.5; // roll left/right
    const targetYaw = -xVelocity * 1.5;  // turn left/right

    if (!collisionTriggered) {
      meshRef.current.rotation.z = THREE.MathUtils.lerp(
        meshRef.current.rotation.z, 
        THREE.MathUtils.clamp(targetRoll, -0.45, 0.45), // cap roll at ~25 degrees
        dt * 10
      );

      meshRef.current.rotation.y = THREE.MathUtils.lerp(
        meshRef.current.rotation.y,
        THREE.MathUtils.clamp(targetYaw, -0.25, 0.25),
        dt * 10
      );

      // Pitch (X rotation) - subtle bobbing up and down
      if (gameState === 'PLAYING') {
        const bobbing = Math.sin(state.clock.getElapsedTime() * 4) * 0.03;
        meshRef.current.position.y = bobbing;
        meshRef.current.rotation.x = bobbing * 0.5;
      }
      
      // Reset collision timer and part offsets during normal flight, adding gap separation
      collisionTime.current = 0;
      
      // 6. TRANSFORMATION PARTS GAP INTERPOLATION (Boost active separation)
      const { boostTimeRemaining } = useGameStore.getState();
      
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

      // Scale up the ship slightly during boost to make the parts separation feel extra premium, clear, and visible
      const currentScale = 1.0 + g * 0.12;
      meshRef.current.scale.set(currentScale, currentScale, currentScale);

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
      // 4. DISINTEGRATION SIMULATION (Newtonian Physics Explosion + Floor Impact)
      collisionTime.current += dt;
      const t = collisionTime.current;
      const gravity = -9.8; // real gravity
      
      // Decay factor for horizontal/rotational speeds due to friction
      // Starts at 1.0 and decays to 0.0 to make parts slide to a halt
      const spinDecay = Math.max(0, Math.exp(-t * 2.2));

      // The track floor is at world Y = -0.5. 
      // The ship parent group pivot is positioned at Y = -0.2 during crash.
      // So the relative floor level inside the group is (-0.5 - (-0.2)) = -0.3.
      // We clamp slightly higher (-0.28) to account for mesh half-height.
      const relativeFloor = -0.28;

      // Central Body (Fuselage)
      if (fuselageRef.current) {
        // y0 = 0, vy = 1.2
        let y = 1.2 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        fuselageRef.current.position.y = y;
        
        // Z moves back but decelerates to a stop
        fuselageRef.current.position.z = -2.5 * (1.0 - Math.exp(-t * 2.0));
        
        // Rotates and dampens to a stop
        fuselageRef.current.rotation.x = t * 3.5 * spinDecay;
        fuselageRef.current.rotation.y = t * 1.8 * spinDecay;
        fuselageRef.current.rotation.z = t * 1.0 * spinDecay;
      }

      // Cockpit Canopy
      if (canopyRef.current) {
        // y0 = 0.1, vy = 4.5
        let y = 0.1 + 4.5 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        canopyRef.current.position.y = y;
        
        // Canopy flies off and slides to a stop
        canopyRef.current.position.x = 0.25 * (1.0 - Math.exp(-t * 2.0));
        canopyRef.current.position.z = 0.1 + 1.2 * (1.0 - Math.exp(-t * 2.0));
        
        canopyRef.current.rotation.x = t * 7.5 * spinDecay;
        canopyRef.current.rotation.y = t * 4.5 * spinDecay;
      }

      // Left Wing
      if (leftWingRef.current) {
        // y0 = -0.05, vy = 2.0
        let y = -0.05 + 2.0 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        leftWingRef.current.position.y = y;
        
        // Flies left and slides to a stop
        leftWingRef.current.position.x = -0.45 - 4.5 * (1.0 - Math.exp(-t * 2.0));
        leftWingRef.current.position.z = -0.1 - 1.0 * (1.0 - Math.exp(-t * 2.0));
        
        leftWingRef.current.rotation.x = t * 4.5 * spinDecay;
        leftWingRef.current.rotation.y = t * 2.0 * spinDecay;
        leftWingRef.current.rotation.z = 0.25 + t * 5.5 * spinDecay;
      }

      // Right Wing
      if (rightWingRef.current) {
        // y0 = -0.05, vy = 2.0
        let y = -0.05 + 2.0 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        rightWingRef.current.position.y = y;
        
        // Flies right and slides to a stop
        rightWingRef.current.position.x = 0.45 + 4.5 * (1.0 - Math.exp(-t * 2.0));
        rightWingRef.current.position.z = -0.1 - 1.0 * (1.0 - Math.exp(-t * 2.0));
        
        rightWingRef.current.rotation.x = t * -4.5 * spinDecay;
        rightWingRef.current.rotation.y = t * 2.0 * spinDecay;
        rightWingRef.current.rotation.z = -0.25 + t * -5.5 * spinDecay;
      }

      // Engine Nozzle
      if (nozzleRef.current) {
        // y0 = -0.05, vy = 0.5
        let y = -0.05 + 0.5 * t + 0.5 * gravity * t * t;
        if (y < relativeFloor) y = relativeFloor;
        nozzleRef.current.position.y = y;
        
        // Slides straight backward
        nozzleRef.current.position.z = -0.85 - 6.5 * (1.0 - Math.exp(-t * 2.0));
        
        nozzleRef.current.rotation.x = Math.PI / 2 + t * 1.5 * spinDecay;
        nozzleRef.current.rotation.y = t * 2.5 * spinDecay;
      }

      // Subtle tilt of the main parent group for crash landing
      meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, 0.15, dt * 2);
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        -0.2,
        dt * 4
      );
      // Reset main group scale during crash so parts explode at standard size
      meshRef.current.scale.set(1.0, 1.0, 1.0);
    }

    // 5. CRYSTAL ABSORB POWER-UP ANIMATION
    const { crystalCount, crystals } = useGameStore.getState();
    if (crystalCount !== lastCount.current) {
      lastCount.current = crystalCount;
      // Find the crystal that was collected around this position
      const collectedCrystal = crystals.find(c => c.collected && Math.abs(c.z - playerZ) < 6.0);
      pendingAbsorbColor.current = collectedCrystal ? collectedCrystal.color : '#00f3ff';
      absorbDelay.current = 0.26; // Wait for the homing crystal to arrive at the ship
    }

    // Tick down delay before triggering visual flash
    if (absorbDelay.current > 0) {
      absorbDelay.current -= dt;
      if (absorbDelay.current <= 0) {
        absorbColor.current = pendingAbsorbColor.current;
        absorbTime.current = 0.25; // Trigger the flash now!
      }
    }

    if (absorbMeshRef.current) {
      if (absorbTime.current > 0 && !collisionTriggered) {
        absorbTime.current -= dt;
        const progress = Math.max(0, absorbTime.current / 0.25);
        
        // Match fuselage position and rotation
        if (fuselageRef.current) {
          absorbMeshRef.current.position.copy(fuselageRef.current.position);
          absorbMeshRef.current.rotation.copy(fuselageRef.current.rotation);
        }
        
        // Shrink onto the fuselage
        const scale = 1.0 + progress * 0.2;
        absorbMeshRef.current.scale.set(scale, scale, scale);
        
        // Traverse all child wireframes to apply dynamic color and fade opacity
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

    // Pulse canopy emissive color and intensity (handles flash when boost is ready or active)
    if (canopyRef.current) {
      const mat = canopyRef.current.material as THREE.MeshStandardMaterial;
      if (mat) {
        const { boostCharge, boostActive } = useGameStore.getState();
        
        if (boostActive && !collisionTriggered) {
          // Glow intense gold/orange during boost
          mat.emissiveIntensity = 2.5;
          mat.emissive.setStyle("#ffe600");
        } else if (boostCharge === 10 && !collisionTriggered) {
          // Pulsate gold when boost is charged and ready to launch
          const pulse = Math.sin(state.clock.getElapsedTime() * 12) * 0.5 + 0.5;
          mat.emissiveIntensity = 0.6 + pulse * 1.5;
          mat.emissive.setStyle(pulse > 0.5 ? "#ffe600" : "#00f3ff");
        } else if (absorbTime.current > 0 && !collisionTriggered) {
          // Normal crystal absorb flash
          const progress = absorbTime.current / 0.25;
          mat.emissiveIntensity = 0.6 + progress * 2.0;
          mat.emissive.setStyle(absorbColor.current);
        } else {
          // Default state
          mat.emissiveIntensity = 0.6;
          mat.emissive.setStyle("#00f3ff");
        }
      }
    }

    // 7. SONIC BLAST WAVE EXPANSION VISUAL
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

    // Superb ship components rotation animations
    if (vortexCoreRef.current) {
      vortexCoreRef.current.rotation.y += dt * 5.0;
      vortexCoreRef.current.rotation.x -= dt * 2.5;
    }
    if (leftChronoRingRef.current) {
      leftChronoRingRef.current.rotation.z += dt * 6.0;
    }
    if (rightChronoRingRef.current) {
      rightChronoRingRef.current.rotation.z -= dt * 6.0;
    }
  });

  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* Sonic Blast Wave Sphere */}
      <mesh ref={blastMeshRef}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial 
          color="#ffe600" 
          transparent={true} 
          opacity={0} 
          wireframe={true} 
        />
      </mesh>

      {/* Dynamic Crystal absorb wireframe: matches fuselage geometry for each equipped skin */}
      <group ref={absorbMeshRef}>
        {equippedSkin === 'vortex' ? (
          <mesh>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
            <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
          </mesh>
        ) : equippedSkin === 'quantum' ? (
          <mesh>
            <boxGeometry args={[0.42, 0.22, 1.4]} />
            <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
          </mesh>
        ) : equippedSkin === 'temporal' ? (
          <group>
            <mesh position={[-0.1, 0, 0.4]}>
              <coneGeometry args={[0.05, 1.1, 6]} />
              <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
            </mesh>
            <mesh position={[0.1, 0, 0.4]}>
              <coneGeometry args={[0.05, 1.1, 6]} />
              <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
            </mesh>
          </group>
        ) : equippedSkin === 'pink' ? (
          <group>
            <mesh>
              <coneGeometry args={[0.26, 1.5, 4]} />
              <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
            </mesh>
          </group>
        ) : equippedSkin === 'cyan' ? (
          <group>
            <mesh position={[-0.09, 0, 0.1]}>
              <coneGeometry args={[0.07, 1.4, 5]} />
              <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
            </mesh>
            <mesh position={[0.09, 0, 0.1]}>
              <coneGeometry args={[0.07, 1.4, 5]} />
              <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
            </mesh>
          </group>
        ) : equippedSkin === 'yellow' ? (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1.4, 6]} />
            <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
          </mesh>
        ) : equippedSkin === 'green' ? (
          <mesh scale={[1, 0.6, 2.8]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
          </mesh>
        ) : equippedSkin === 'purple' ? (
          <mesh scale={[1, 0.8, 3.8]}>
            <octahedronGeometry args={[0.22]} />
            <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
          </mesh>
        ) : (
          <mesh>
            <coneGeometry args={[0.3, 1.6, 5]} />
            <meshBasicMaterial transparent={true} opacity={0} wireframe={true} />
          </mesh>
        )}
      </group>

      {/* Vortex Singularity Core */}
      {equippedSkin === 'vortex' && (
        <group ref={vortexCoreRef} position={[0, 0.22, 0]}>
          {/* Outer glowing wireframe dodecahedron */}
          <mesh>
            <dodecahedronGeometry args={[0.22, 0]} />
            <meshBasicMaterial color="#00f3ff" wireframe={true} transparent={true} opacity={0.8} />
          </mesh>
          {/* Inner solid glowing core */}
          <mesh>
            <sphereGeometry args={[0.09, 8, 8]} />
            <meshStandardMaterial color="#ffffff" emissive="#ff00ff" emissiveIntensity={2.5} />
          </mesh>
          {/* Little energy ring */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.25, 0.02, 6, 16]} />
            <meshBasicMaterial color="#ff00ff" transparent={true} opacity={0.6} />
          </mesh>
        </group>
      )}

      {/* 1. Fuselage */}
      {equippedSkin === 'vortex' ? (
        <group ref={fuselageRef}>
          {/* Vortex Singelage: Sleek chrome needle core */}
          <mesh castShadow>
            <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.9} flatShading={true} />
          </mesh>
          <mesh position={[0, -0.2, 0]}>
            <cylinderGeometry args={[0.16, 0.16, 0.5, 6]} />
            <meshBasicMaterial color="#ff00ff" wireframe={true} />
          </mesh>
        </group>
      ) : equippedSkin === 'quantum' ? (
        <group ref={fuselageRef}>
          {/* Quantum Heavy Blocky Visor Fuselage */}
          <mesh castShadow>
            <boxGeometry args={[0.42, 0.22, 1.4]} />
            <meshStandardMaterial color="#1a1a24" roughness={0.85} metalness={0.15} flatShading={true} />
          </mesh>
          <mesh>
            <boxGeometry args={[0.43, 0.23, 1.42]} />
            <meshBasicMaterial color="#00ffff" wireframe={true} transparent={true} opacity={0.25} />
          </mesh>
        </group>
      ) : equippedSkin === 'temporal' ? (
        <group ref={fuselageRef}>
          {/* Temporal Twin-needle Nose & Frame */}
          <mesh position={[-0.1, 0, 0.4]} castShadow>
            <coneGeometry args={[0.05, 1.1, 6]} />
            <meshStandardMaterial color="#d4af37" roughness={0.15} metalness={0.9} flatShading={true} />
          </mesh>
          <mesh position={[0.1, 0, 0.4]} castShadow>
            <coneGeometry args={[0.05, 1.1, 6]} />
            <meshStandardMaterial color="#d4af37" roughness={0.15} metalness={0.9} flatShading={true} />
          </mesh>
          <mesh castShadow>
            <boxGeometry args={[0.22, 0.12, 0.8]} />
            <meshStandardMaterial color="#554411" roughness={0.3} metalness={0.8} flatShading={true} />
          </mesh>
        </group>
      ) : equippedSkin === 'pink' ? (
        <group ref={fuselageRef}>
          {/* Laser Pink wedge hull */}
          <mesh castShadow>
            <coneGeometry args={[0.26, 1.5, 4]} />
            <meshStandardMaterial color="#ddccd7" roughness={0.15} metalness={0.95} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.05, 0.1]}>
            <boxGeometry args={[0.08, 0.04, 0.8]} />
            <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ) : equippedSkin === 'cyan' ? (
        <group ref={fuselageRef}>
          {/* Cyan Flare Split Racer Nose */}
          <mesh position={[-0.09, 0, 0.1]} castShadow>
            <coneGeometry args={[0.07, 1.4, 5]} />
            <meshStandardMaterial color="#1a3545" roughness={0.1} metalness={0.85} flatShading={true} />
          </mesh>
          <mesh position={[0.09, 0, 0.1]} castShadow>
            <coneGeometry args={[0.07, 1.4, 5]} />
            <meshStandardMaterial color="#1a3545" roughness={0.1} metalness={0.85} flatShading={true} />
          </mesh>
          <mesh position={[0, -0.04, -0.2]} castShadow>
            <boxGeometry args={[0.22, 0.08, 0.6]} />
            <meshStandardMaterial color="#0c1b24" roughness={0.3} metalness={0.7} />
          </mesh>
          <mesh position={[0, 0.02, 0]}>
            <boxGeometry args={[0.05, 0.02, 0.9]} />
            <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ) : equippedSkin === 'yellow' ? (
        <group ref={fuselageRef}>
          {/* Solar Yellow Hexagonal Body */}
          <mesh castShadow rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.15, 0.2, 1.4, 6]} />
            <meshStandardMaterial color="#ffe600" roughness={0.3} metalness={0.5} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.08, -0.1]} castShadow>
            <boxGeometry args={[0.22, 0.08, 0.9]} />
            <meshStandardMaterial color="#1a1813" roughness={0.7} metalness={0.3} />
          </mesh>
        </group>
      ) : equippedSkin === 'green' ? (
        <group ref={fuselageRef}>
          {/* Acid Green Organic shell carapace */}
          <mesh castShadow>
            <sphereGeometry args={[0.22, 8, 8]} scale={[1, 0.6, 2.8]} />
            <meshStandardMaterial color="#1b2a1a" roughness={0.75} metalness={0.1} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.06, 0.4]}>
            <sphereGeometry args={[0.05, 5, 5]} />
            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.5} />
          </mesh>
          <mesh position={[0, 0.06, -0.4]}>
            <sphereGeometry args={[0.05, 5, 5]} />
            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.5} />
          </mesh>
        </group>
      ) : equippedSkin === 'purple' ? (
        <group ref={fuselageRef}>
          {/* Nebula Violet Diamond Hull */}
          <mesh castShadow>
            <octahedronGeometry args={[0.22]} scale={[1, 0.8, 3.8]} />
            <meshStandardMaterial color="#130a1c" roughness={0.05} metalness={0.95} flatShading={true} />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[0.02, 0.02, 1.2]} />
            <meshStandardMaterial color="#9d00ff" emissive="#9d00ff" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ) : (
        /* Fallback Fuselage */
        <mesh ref={fuselageRef} castShadow>
          <coneGeometry args={[0.3, 1.6, 5]} />
          <meshStandardMaterial 
            color="#121225" 
            roughness={0.2}
            metalness={0.8}
            flatShading={true}
          />
        </mesh>
      )}

      {/* 2. Cockpit Canopy */}
      {equippedSkin === 'vortex' ? (
        <mesh ref={canopyRef} position={[0, 0.14, 0.1]}>
          <sphereGeometry args={[0.13, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ff00ff" emissiveIntensity={1.2} transparent={true} opacity={0.65} />
        </mesh>
      ) : equippedSkin === 'quantum' ? (
        <mesh ref={canopyRef} position={[0, 0.12, 0.25]}>
          <boxGeometry args={[0.26, 0.05, 0.2]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={1.8} />
        </mesh>
      ) : equippedSkin === 'temporal' ? (
        <mesh ref={canopyRef} position={[0, 0.09, 0.1]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffaa00" emissiveIntensity={1.0} transparent={true} opacity={0.7} />
        </mesh>
      ) : equippedSkin === 'pink' ? (
        <mesh ref={canopyRef} position={[0, 0.1, 0.1]}>
          <boxGeometry args={[0.14, 0.08, 0.4]} />
          <meshStandardMaterial color="#ff0055" emissive="#ff0055" emissiveIntensity={1.2} transparent={true} opacity={0.7} />
        </mesh>
      ) : equippedSkin === 'cyan' ? (
        <mesh ref={canopyRef} position={[0, 0.08, 0.0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.5, 12]} />
          <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={1.5} transparent={true} opacity={0.75} />
        </mesh>
      ) : equippedSkin === 'yellow' ? (
        <mesh ref={canopyRef} position={[0, 0.12, 0.1]}>
          <boxGeometry args={[0.14, 0.1, 0.32]} />
          <meshStandardMaterial color="#ffaa00" emissive="#ffe600" emissiveIntensity={0.8} transparent={true} opacity={0.7} />
        </mesh>
      ) : equippedSkin === 'green' ? (
        <mesh ref={canopyRef} position={[0, 0.09, 0.2]}>
          <boxGeometry args={[0.18, 0.03, 0.16]} />
          <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={2.0} />
        </mesh>
      ) : equippedSkin === 'purple' ? (
        <mesh ref={canopyRef} position={[0, 0.1, 0.15]}>
          <octahedronGeometry args={[0.08]} scale={[1, 0.8, 1.8]} />
          <meshStandardMaterial color="#9d00ff" emissive="#9d00ff" emissiveIntensity={1.6} transparent={true} opacity={0.6} />
        </mesh>
      ) : (
        /* Fallback Canopy */
        <mesh ref={canopyRef} position={[0, 0.1, 0.1]}>
          <boxGeometry args={[0.16, 0.12, 0.5]} />
          <meshStandardMaterial 
            color="#00f3ff" 
            emissive="#00f3ff" 
            emissiveIntensity={0.6}
            transparent={true}
            opacity={0.8}
          />
        </mesh>
      )}

      {/* 3. Left Wing */}
      {equippedSkin === 'vortex' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Vortex Split Orbital Disc Wing (Left Half) */}
          <mesh rotation={[0, 0, 0]} castShadow>
            <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, 0]}>
            <torusGeometry args={[0.64, 0.01, 4, 32, Math.PI]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
        </group>
      ) : equippedSkin === 'quantum' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Quantum Heavy Forward swept Wing */}
          <mesh rotation={[0, 0.35, 0]} castShadow>
            <boxGeometry args={[0.75, 0.06, 0.38]} />
            <meshStandardMaterial color="#1e1e2d" roughness={0.8} metalness={0.2} flatShading={true} />
          </mesh>
          <group position={[-0.42, 0.04, 0.1]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.24, 0.26]} />
              <meshStandardMaterial color="#0c0c14" roughness={0.5} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.09, 0.26, 0.28]} />
              <meshBasicMaterial color="#00ffff" wireframe={true} />
            </mesh>
          </group>
        </group>
      ) : equippedSkin === 'temporal' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Temporal Chrono Wing & Spinning Ring */}
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.03, 0.2]} />
            <meshStandardMaterial color="#d4af37" roughness={0.15} metalness={0.9} flatShading={true} />
          </mesh>
          <group position={[-0.42, 0.05, 0.0]}>
            <mesh ref={leftChronoRingRef}>
              <torusGeometry args={[0.18, 0.025, 6, 16]} />
              <meshBasicMaterial color="#ffe600" transparent={true} opacity={0.8} wireframe={true} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color="#333" metalness={0.9} />
            </mesh>
          </group>
        </group>
      ) : equippedSkin === 'pink' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Laser Pink Left Wing */}
          <mesh castShadow>
            <boxGeometry args={[0.75, 0.04, 0.4]} />
            <meshStandardMaterial color="#2d1a2f" roughness={0.2} metalness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[-0.38, 0, 0.05]}>
            <boxGeometry args={[0.03, 0.06, 0.42]} />
            <meshBasicMaterial color="#ff0055" />
          </mesh>
        </group>
      ) : equippedSkin === 'cyan' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Cyan Flare Left Wing */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.03, 0.3]} />
            <meshStandardMaterial color="#1a3545" roughness={0.1} metalness={0.85} flatShading={true} />
          </mesh>
          <mesh position={[-0.1, 0.02, 0]}>
            <boxGeometry args={[0.5, 0.01, 0.06]} />
            <meshBasicMaterial color="#00f3ff" />
          </mesh>
          <mesh position={[-0.4, 0, -0.05]} rotation={[Math.PI / 2, 0.2, 0]}>
            <coneGeometry args={[0.04, 0.3, 4]} />
            <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ) : equippedSkin === 'yellow' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Solar Yellow Left Wing solar panel */}
          <mesh castShadow>
            <boxGeometry args={[0.75, 0.06, 0.45]} />
            <meshStandardMaterial color="#1a1813" roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh position={[-0.1, 0.04, 0]}>
            <boxGeometry args={[0.42, 0.01, 0.38]} />
            <meshStandardMaterial color="#ffe600" roughness={0.2} metalness={0.9} flatShading={true} />
          </mesh>
          <mesh position={[-0.38, 0.02, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.46]} />
            <meshStandardMaterial color="#ffe600" emissive="#ffe600" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ) : equippedSkin === 'green' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Acid Green Organic left claw wing */}
          <mesh castShadow rotation={[Math.PI / 2, 0, Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.8, 3]} />
            <meshStandardMaterial color="#111d11" roughness={0.8} metalness={0.05} flatShading={true} />
          </mesh>
          <mesh position={[-0.1, 0, 0.05]}>
            <boxGeometry args={[0.4, 0.01, 0.04]} />
            <meshBasicMaterial color="#39ff14" />
          </mesh>
          <mesh position={[-0.4, 0, -0.1]} rotation={[0, 0.5, 0]}>
            <coneGeometry args={[0.03, 0.35, 3]} />
            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ) : equippedSkin === 'purple' ? (
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          {/* Nebula Violet Left Wing with gravity-well */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.02, 0.36]} />
            <meshStandardMaterial color="#130a1c" roughness={0.1} metalness={0.9} flatShading={true} />
          </mesh>
          <group position={[-0.38, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.12, 0.015, 6, 12]} />
              <meshBasicMaterial color="#9d00ff" wireframe={true} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshStandardMaterial color="#ffffff" emissive="#9d00ff" emissiveIntensity={2.0} />
            </mesh>
          </group>
        </group>
      ) : (
        /* Fallback Left Wing */
        <group ref={leftWingRef} position={[-0.45, -0.05, -0.1]} rotation={[0, -0.1, 0.25]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.05, 0.5]} />
            <meshStandardMaterial 
              color="#1d1d35" 
              roughness={0.3} 
              metalness={0.7} 
              flatShading={true}
            />
          </mesh>
          <mesh position={[-0.4, 0.0, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.52]} />
            <meshBasicMaterial color="#00f3ff" />
          </mesh>
        </group>
      )}

      {/* 4. Right Wing */}
      {equippedSkin === 'vortex' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Vortex Split Orbital Disc Wing (Right Half) */}
          <mesh rotation={[0, 0, Math.PI]} castShadow>
            <torusGeometry args={[0.62, 0.026, 8, 32, Math.PI]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.9} />
          </mesh>
          <mesh rotation={[0, 0, Math.PI]}>
            <torusGeometry args={[0.64, 0.01, 4, 32, Math.PI]} />
            <meshBasicMaterial color="#ff00ff" />
          </mesh>
        </group>
      ) : equippedSkin === 'quantum' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Quantum Heavy Forward swept Wing */}
          <mesh rotation={[0, -0.35, 0]} castShadow>
            <boxGeometry args={[0.75, 0.06, 0.38]} />
            <meshStandardMaterial color="#1e1e2d" roughness={0.8} metalness={0.2} flatShading={true} />
          </mesh>
          <group position={[0.42, 0.04, 0.1]}>
            <mesh castShadow>
              <boxGeometry args={[0.08, 0.24, 0.26]} />
              <meshStandardMaterial color="#0c0c14" roughness={0.5} />
            </mesh>
            <mesh>
              <boxGeometry args={[0.09, 0.26, 0.28]} />
              <meshBasicMaterial color="#00ffff" wireframe={true} />
            </mesh>
          </group>
        </group>
      ) : equippedSkin === 'temporal' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Temporal Chrono Wing & Spinning Ring */}
          <mesh castShadow>
            <boxGeometry args={[0.85, 0.03, 0.2]} />
            <meshStandardMaterial color="#d4af37" roughness={0.15} metalness={0.9} flatShading={true} />
          </mesh>
          <group position={[0.42, 0.05, 0.0]}>
            <mesh ref={rightChronoRingRef}>
              <torusGeometry args={[0.18, 0.025, 6, 16]} />
              <meshBasicMaterial color="#ffe600" transparent={true} opacity={0.8} wireframe={true} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial color="#333" metalness={0.9} />
            </mesh>
          </group>
        </group>
      ) : equippedSkin === 'pink' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Laser Pink Right Wing */}
          <mesh castShadow>
            <boxGeometry args={[0.75, 0.04, 0.4]} />
            <meshStandardMaterial color="#2d1a2f" roughness={0.2} metalness={0.8} flatShading={true} />
          </mesh>
          <mesh position={[0.38, 0, 0.05]}>
            <boxGeometry args={[0.03, 0.06, 0.42]} />
            <meshBasicMaterial color="#ff0055" />
          </mesh>
        </group>
      ) : equippedSkin === 'cyan' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Cyan Flare Right Wing */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.03, 0.3]} />
            <meshStandardMaterial color="#1a3545" roughness={0.1} metalness={0.85} flatShading={true} />
          </mesh>
          <mesh position={[0.1, 0.02, 0]}>
            <boxGeometry args={[0.5, 0.01, 0.06]} />
            <meshBasicMaterial color="#00f3ff" />
          </mesh>
          <mesh position={[0.4, 0, -0.05]} rotation={[Math.PI / 2, -0.2, 0]}>
            <coneGeometry args={[0.04, 0.3, 4]} />
            <meshStandardMaterial color="#00f3ff" emissive="#00f3ff" emissiveIntensity={0.8} />
          </mesh>
        </group>
      ) : equippedSkin === 'yellow' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Solar Yellow Right Wing solar panel */}
          <mesh castShadow>
            <boxGeometry args={[0.75, 0.06, 0.45]} />
            <meshStandardMaterial color="#1a1813" roughness={0.85} metalness={0.1} />
          </mesh>
          <mesh position={[0.1, 0.04, 0]}>
            <boxGeometry args={[0.42, 0.01, 0.38]} />
            <meshStandardMaterial color="#ffe600" roughness={0.2} metalness={0.9} flatShading={true} />
          </mesh>
          <mesh position={[0.38, 0.02, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.46]} />
            <meshStandardMaterial color="#ffe600" emissive="#ffe600" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ) : equippedSkin === 'green' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Acid Green Organic right claw wing */}
          <mesh castShadow rotation={[Math.PI / 2, 0, -Math.PI / 2]}>
            <coneGeometry args={[0.1, 0.8, 3]} />
            <meshStandardMaterial color="#111d11" roughness={0.8} metalness={0.05} flatShading={true} />
          </mesh>
          <mesh position={[0.1, 0, 0.05]}>
            <boxGeometry args={[0.4, 0.01, 0.04]} />
            <meshBasicMaterial color="#39ff14" />
          </mesh>
          <mesh position={[0.4, 0, -0.1]} rotation={[0, -0.5, 0]}>
            <coneGeometry args={[0.03, 0.35, 3]} />
            <meshStandardMaterial color="#39ff14" emissive="#39ff14" emissiveIntensity={1.0} />
          </mesh>
        </group>
      ) : equippedSkin === 'purple' ? (
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          {/* Nebula Violet Right Wing with gravity-well */}
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.02, 0.36]} />
            <meshStandardMaterial color="#130a1c" roughness={0.1} metalness={0.9} flatShading={true} />
          </mesh>
          <group position={[0.38, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[0.12, 0.015, 6, 12]} />
              <meshBasicMaterial color="#9d00ff" wireframe={true} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.03, 6, 6]} />
              <meshStandardMaterial color="#ffffff" emissive="#9d00ff" emissiveIntensity={2.0} />
            </mesh>
          </group>
        </group>
      ) : (
        /* Fallback Right Wing */
        <group ref={rightWingRef} position={[0.45, -0.05, -0.1]} rotation={[0, 0.1, -0.25]}>
          <mesh castShadow>
            <boxGeometry args={[0.8, 0.05, 0.5]} />
            <meshStandardMaterial 
              color="#1d1d35" 
              roughness={0.3} 
              metalness={0.7} 
              flatShading={true}
            />
          </mesh>
          <mesh position={[0.4, 0.0, 0]}>
            <boxGeometry args={[0.04, 0.08, 0.52]} />
            <meshBasicMaterial color="#ff007f" />
          </mesh>
        </group>
      )}

      {/* 5. Engine Thrusters & Exhaust Glow */}
      <group ref={nozzleRef} position={[0, -0.05, -0.85]} rotation={[Math.PI / 2, 0, 0]}>
        {/* Metal Engine Nozzle customized for each skin */}
        {equippedSkin === 'vortex' ? (
          <mesh>
            <cylinderGeometry args={[0.06, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#eeeeee" roughness={0.1} metalness={0.9} />
          </mesh>
        ) : equippedSkin === 'quantum' ? (
          <group>
            {/* Double square exhaust ports */}
            <mesh position={[-0.08, 0, 0]}>
              <boxGeometry args={[0.1, 0.12, 0.2]} />
              <meshStandardMaterial color="#2d2d3d" roughness={0.7} metalness={0.3} />
            </mesh>
            <mesh position={[0.08, 0, 0]}>
              <boxGeometry args={[0.1, 0.12, 0.2]} />
              <meshStandardMaterial color="#2d2d3d" roughness={0.7} metalness={0.3} />
            </mesh>
          </group>
        ) : equippedSkin === 'temporal' ? (
          <mesh rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.08, 0.25, 6]} />
            <meshStandardMaterial color="#d4af37" roughness={0.2} metalness={0.8} />
          </mesh>
        ) : equippedSkin === 'cyan' ? (
          <group>
            {/* Triple circular thrusters */}
            <mesh position={[-0.08, 0, -0.02]}>
              <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
              <meshStandardMaterial color="#152e3c" metalness={0.8} />
            </mesh>
            <mesh position={[0, 0, 0.02]}>
              <cylinderGeometry args={[0.05, 0.07, 0.2, 6]} />
              <meshStandardMaterial color="#152e3c" metalness={0.8} />
            </mesh>
            <mesh position={[0.08, 0, -0.02]}>
              <cylinderGeometry args={[0.04, 0.06, 0.2, 6]} />
              <meshStandardMaterial color="#152e3c" metalness={0.8} />
            </mesh>
          </group>
        ) : equippedSkin === 'yellow' ? (
          <mesh>
            <boxGeometry args={[0.2, 0.2, 0.18]} />
            <meshStandardMaterial color="#332b11" roughness={0.4} metalness={0.6} />
          </mesh>
        ) : equippedSkin === 'green' ? (
          <mesh>
            <sphereGeometry args={[0.12, 8, 8]} />
            <meshStandardMaterial color="#1b2a1a" roughness={0.9} />
          </mesh>
        ) : equippedSkin === 'purple' ? (
          <group>
            {/* Twin round exhaust ports */}
            <mesh position={[-0.06, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.22, 6]} />
              <meshStandardMaterial color="#1c122c" metalness={0.9} />
            </mesh>
            <mesh position={[0.06, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.22, 6]} />
              <meshStandardMaterial color="#1c122c" metalness={0.9} />
            </mesh>
          </group>
        ) : (
          /* Laser Pink / Default single circular thruster */
          <mesh>
            <cylinderGeometry args={[0.12, 0.15, 0.25, 6]} />
            <meshStandardMaterial color="#2d1a2f" metalness={0.9} />
          </mesh>
        )}
        
        {/* Glowing Exhaust Cone */}
        {gameState === 'PLAYING' && !collisionTriggered && (
          <EngineFlame />
        )}
      </group>

      {/* Under-ship point light to cast a glow onto the road grid - dynamically matching active skin */}
      <pointLight 
        position={[0, -0.3, -0.3]} 
        intensity={1.5} 
        distance={4} 
        color={
          equippedSkin === 'pink' ? '#ff0055' :
          equippedSkin === 'cyan' ? '#00f3ff' :
          equippedSkin === 'yellow' ? '#ffe600' :
          equippedSkin === 'green' ? '#39ff14' :
          equippedSkin === 'purple' ? '#9d00ff' :
          equippedSkin === 'vortex' ? '#ff00ff' :
          equippedSkin === 'quantum' ? '#00ffff' :
          equippedSkin === 'temporal' ? '#ffe600' :
          '#c084fc'
        }
      />

      {/* Hexagonal cyberpunk energy shield bubble */}
      {shieldActive && (
        <>
          {/* Inner Cyan Layer */}
          <mesh position={[0, 0, 0]}>
            <dodecahedronGeometry args={[0.85, 1]} />
            <meshBasicMaterial 
              color="#00f3ff" 
              wireframe={true} 
              transparent={true} 
              opacity={0.3} 
            />
          </mesh>
          {/* Outer Pink/Magenta Layer for Double Shield */}
          {shieldStrength === 2 && (
            <mesh position={[0, 0, 0]}>
              <dodecahedronGeometry args={[0.95, 1]} />
              <meshBasicMaterial 
                color="#ff007f" 
                wireframe={true} 
                transparent={true} 
                opacity={0.2} 
              />
            </mesh>
          )}
        </>
      )}
    </group>
  );
}

// Flickering engine plume helper component supporting single, twin, and triple flames
function EngineFlame() {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (!groupRef.current) return;
    const { boostActive, upgrades } = useGameStore.getState();
    const equippedSkin = upgrades?.equippedSkin ?? 'pink';

    // Animate scale of the thruster flame to look reactive/flickering, extra large during boost
    const baseScale = boostActive ? 2.5 : 1.0;
    const flickerSpeed = boostActive ? 80 : 45;
    const scaleYFactor = baseScale * (boostActive ? 3.0 : 1.8) + Math.sin(state.clock.getElapsedTime() * flickerSpeed) * 0.15;
    const scaleXZFactor = baseScale + Math.sin(state.clock.getElapsedTime() * (flickerSpeed + 5)) * 0.08;

    groupRef.current.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      mesh.scale.set(scaleXZFactor, scaleYFactor, scaleXZFactor);
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) {
        if (boostActive) {
          mat.color.setStyle('#ffe600');
        } else {
          let flameColor = '#ff0055'; // Default Pink
          if (equippedSkin === 'cyan') flameColor = '#00f3ff';
          if (equippedSkin === 'yellow') flameColor = '#ffe600';
          if (equippedSkin === 'green') flameColor = '#39ff14';
          if (equippedSkin === 'purple') flameColor = '#9d00ff';
          if (equippedSkin === 'vortex') flameColor = '#a6f9ff';
          if (equippedSkin === 'quantum') flameColor = '#00ffff';
          if (equippedSkin === 'temporal') flameColor = '#ffaa00';
          mat.color.setStyle(flameColor);
        }
      }
    });
  });

  const { upgrades } = useGameStore.getState();
  const equippedSkin = upgrades?.equippedSkin ?? 'pink';

  if (equippedSkin === 'quantum' || equippedSkin === 'purple') {
    // Twin engine flames
    return (
      <group ref={groupRef}>
        <mesh position={[-0.08, -0.22, 0]}>
          <coneGeometry args={[0.04, 0.35, 5]} />
          <meshBasicMaterial color="#ff0055" transparent={true} opacity={0.95} />
        </mesh>
        <mesh position={[0.08, -0.22, 0]}>
          <coneGeometry args={[0.04, 0.35, 5]} />
          <meshBasicMaterial color="#ff0055" transparent={true} opacity={0.95} />
        </mesh>
      </group>
    );
  }

  if (equippedSkin === 'cyan') {
    // Triple engine flames
    return (
      <group ref={groupRef}>
        <mesh position={[-0.08, -0.22, -0.02]}>
          <coneGeometry args={[0.035, 0.3, 5]} />
          <meshBasicMaterial color="#ff0055" transparent={true} opacity={0.95} />
        </mesh>
        <mesh position={[0, -0.22, 0.02]}>
          <coneGeometry args={[0.045, 0.35, 5]} />
          <meshBasicMaterial color="#ff0055" transparent={true} opacity={0.95} />
        </mesh>
        <mesh position={[0.08, -0.22, -0.02]}>
          <coneGeometry args={[0.035, 0.3, 5]} />
          <meshBasicMaterial color="#ff0055" transparent={true} opacity={0.95} />
        </mesh>
      </group>
    );
  }

  // Single engine flame (standard, vortex, temporal, solar yellow, acid green, pink)
  return (
    <group ref={groupRef}>
      <mesh position={[0, -0.22, 0]}>
        <coneGeometry args={[0.08, 0.35, 5]} />
        <meshBasicMaterial color="#ff0055" transparent={true} opacity={0.95} />
      </mesh>
    </group>
  );
}
