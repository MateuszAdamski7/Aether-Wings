import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { SECTORS, getSectorAtZ, getSectorTransition } from '../../config/gameConfig';

// Custom shader for the classic Synthwave Sun
const SunShader = {
  uniforms: {
    uTime: { value: 0 },
    uColorBottom: { value: new THREE.Color(1.0, 0.55, 0.0) }, // Orange-yellow
    uColorTop: { value: new THREE.Color(1.0, 0.0, 0.5) }       // Magenta-pink
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    varying vec2 vUv;
    uniform float uTime;
    uniform vec3 uColorBottom;
    uniform vec3 uColorTop;

    void main() {
      // Color gradient from dynamic uniforms
      vec3 finalColor = mix(uColorBottom, uColorTop, vUv.y);
      
      // Sliced grid bars: stripes get thinner at the bottom, wider at the top
      float frequency = 30.0;
      float stripe = sin(vUv.y * frequency - uTime * 0.3);
      
      // Wider black gaps at the bottom, thinner gaps at the top
      float threshold = mix(0.15, -0.6, vUv.y);
      
      if (stripe < threshold) {
        discard;
      }
      
      // Add a slight glow effect towards the core
      float distToCenter = length(vUv - vec2(0.5, 0.5));
      float glow = 1.0 - smoothstep(0.0, 0.5, distToCenter);
      vec3 glowColor = mix(finalColor, vec3(1.0, 0.9, 0.8), glow * 0.4);
      
      gl_FragColor = vec4(glowColor, 1.0);
    }
  `
};

const MOUNTAINS = Array.from({ length: 12 }).map((_, i) => {
  const isRight = i % 2 === 0;
  const x = isRight ? 12 : -12;
  const index = Math.floor(i / 2);
  const zOffset = index * 45;
  
  const height = 6 + Math.random() * 8;
  const radius = 3 + Math.random() * 4;
  const color = isRight ? '#ff007f' : '#00f3ff';

  return { x, zOffset, height, radius, color };
});

export default function Environment() {
  const sunMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const followGroupRef = useRef<THREE.Group>(null);

  // Reactively subscribe for star color switches (infrequent re-renders)
  const currentSector = useGameStore((state) => state.currentSector);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  
  // Colors for star sparkles in each sector biome
  const starColor1 = SECTORS[currentSector - 1]?.colors.star1 ?? '#00f3ff';
  const starColor2 = SECTORS[currentSector - 1]?.colors.star2 ?? '#ff007f';

  // Update shader uniforms and followGroup Z position
  useFrame((state, delta) => {
    const { playerZ, slowMoActiveTime } = useGameStore.getState();
    const slowMoActive = slowMoActiveTime > 0;
    const dt = Math.min(delta, 0.1) * (slowMoActive ? 0.65 : 1.0);

    const { currentSector, nextSector, t } = getSectorTransition(playerZ);

    const targetBottom = new THREE.Color(currentSector.colors.skyBottom);
    const targetTop = new THREE.Color(currentSector.colors.skyTop);
    const targetFogColor = new THREE.Color(currentSector.colors.fog);

    if (nextSector && t > 0) {
      const nextBottom = new THREE.Color(nextSector.colors.skyBottom);
      const nextTop = new THREE.Color(nextSector.colors.skyTop);
      const nextFogColor = new THREE.Color(nextSector.colors.fog);

      targetBottom.lerp(nextBottom, t);
      targetTop.lerp(nextTop, t);
      targetFogColor.lerp(nextFogColor, t);
    }

    if (sunMaterialRef.current) {
      // Animate stripes
      sunMaterialRef.current.uniforms.uTime.value += dt;

      const currentBottom = sunMaterialRef.current.uniforms.uColorBottom.value as THREE.Color;
      const currentTop = sunMaterialRef.current.uniforms.uColorTop.value as THREE.Color;
      currentBottom.copy(targetBottom);
      currentTop.copy(targetTop);
    }

    if (state.scene.fog) {
      state.scene.fog.color.lerp(targetFogColor, dt * 3.0);
    }
    // Sync background clear color with fog
    state.scene.background = state.scene.fog?.color ?? new THREE.Color('#03030c');

    if (followGroupRef.current) {
      followGroupRef.current.position.z = playerZ;
    }
  });

  return (
    <>
      {/* Deep Space Background Color */}
      <color attach="background" args={['#03030c']} />
      
      {/* Ambient Space Fog */}
      <fog attach="fog" args={['#03030c', 30, 160]} />

      {/* Basic Lights */}
      <ambientLight intensity={0.15} />
      <directionalLight 
        position={[0, 15, -10]} 
        intensity={0.6} 
        color="#c084fc" 
      />

      {/* Group that moves along with the player position to keep elements in view */}
      <group ref={followGroupRef}>
        {/* Floating Retro Stars/Particles */}
        <Sparkles
          count={graphicsQuality === 'HIGH' ? 250 : 80}
          scale={[60, 30, 180]}
          position={[0, 10, 40]} // Relative to group
          size={2.5}
          speed={0.3}
          noise={1}
          color={starColor1}
        />
        <Sparkles
          count={graphicsQuality === 'HIGH' ? 200 : 60}
          scale={[60, 30, 180]}
          position={[0, 10, 40]} // Relative to group
          size={2.0}
          speed={0.4}
          noise={1.5}
          color={starColor2}
        />

        {/* Sliced Synthwave Sun in the far distance */}
        <mesh position={[0, 28, 140]} rotation={[0, Math.PI, 0]}>
          <circleGeometry args={[26, 64]} />
          <shaderMaterial
            ref={sunMaterialRef}
            vertexShader={SunShader.vertexShader}
            fragmentShader={SunShader.fragmentShader}
            uniforms={SunShader.uniforms}
            transparent={true}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* Neon Mountains / Side Pyramids (Morphs into skyscrapers in advanced sectors) */}
      {MOUNTAINS.map((mountain, index) => {
        return (
          <MountainInstance
            key={index}
            mountain={mountain}
          />
        );
      })}

    </>
  );
}

interface MountainProps {
  mountain: {
    x: number;
    zOffset: number;
    height: number;
    radius: number;
    color: string;
  };
}

function MountainInstance({ mountain }: MountainProps) {
  const meshRef = useRef<THREE.Group>(null);
  const pyramidGroupRef = useRef<THREE.Group>(null);
  const towerGroupRef = useRef<THREE.Group>(null);
  const pyramidWireRef = useRef<THREE.MeshBasicMaterial>(null);
  const towerWireRef = useRef<THREE.MeshBasicMaterial>(null);

  const spacing = 45;
  const totalLength = 6 * spacing; // 270 units total span

  useFrame((_state, delta) => {
    if (!meshRef.current) return;
    
    const { playerZ, slowMoActiveTime } = useGameStore.getState();
    const slowMoActive = slowMoActiveTime > 0;
    const dt = Math.min(delta, 0.1) * (slowMoActive ? 0.65 : 1.0);
    
    // Relative scrolling position
    let relativeZ = mountain.zOffset - (playerZ % totalLength);
    
    // Wrap around relative Z if it goes too far behind the player
    if (relativeZ < -30) {
      relativeZ += totalLength;
    } else if (relativeZ > 240) {
      relativeZ -= totalLength;
    }
    
    // Convert relative Z to absolute world coordinate Z
    const absoluteZ = playerZ + relativeZ;
    
    meshRef.current.position.z = absoluteZ;

    // Toggle geometry visibility based on absolute Z position
    const currentSectorConfig = getSectorAtZ(absoluteZ);
    const isPyramid = currentSectorConfig.geometryType === 'PYRAMID';
    if (pyramidGroupRef.current) pyramidGroupRef.current.visible = isPyramid;
    if (towerGroupRef.current) towerGroupRef.current.visible = !isPyramid;

    // Smoothly update neon outline colors at biome boundaries
    if (isPyramid) {
      if (pyramidWireRef.current) {
        const targetColor = new THREE.Color(
          mountain.x > 0 ? currentSectorConfig.colors.mountainRight : currentSectorConfig.colors.mountainLeft
        );
        pyramidWireRef.current.color.lerp(targetColor, dt * 4.0);
      }
    } else {
      if (towerWireRef.current) {
        const targetColor = new THREE.Color(
          mountain.x > 0 ? currentSectorConfig.colors.mountainRight : currentSectorConfig.colors.mountainLeft
        );
        towerWireRef.current.color.lerp(targetColor, dt * 4.0);
      }
    }
  });

  return (
    <group ref={meshRef} position={[mountain.x, 0, 0]}>
      {/* 1. PYRAMID SHAPE (Sector 1) */}
      <group ref={pyramidGroupRef} position={[0, mountain.height / 2 - 2, 0]}>
        {/* Inner solid pyramid */}
        <mesh>
          <coneGeometry args={[mountain.radius, mountain.height, 4]} />
          <meshBasicMaterial 
            color="#060613" 
            transparent={true} 
            opacity={0.8} 
          />
        </mesh>
        
        {/* Outer wireframe pyramid */}
        <mesh>
          <coneGeometry args={[mountain.radius + 0.05, mountain.height, 4]} />
          <meshBasicMaterial
            ref={pyramidWireRef}
            color={mountain.x > 0 ? '#ff007f' : '#00f3ff'}
            wireframe={true}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
      </group>

      {/* 2. SKYSCRAPER SHAPE (Sector 2 & 3) */}
      <group ref={towerGroupRef} position={[0, mountain.height / 2 - 1.5, 0]}>
        {/* Solid Skyscraper Tower */}
        <mesh>
          <boxGeometry args={[mountain.radius * 1.2, mountain.height, mountain.radius * 1.2]} />
          <meshBasicMaterial 
            color="#03030c" 
            transparent={true} 
            opacity={0.85} 
          />
        </mesh>
        
        {/* Wireframe Skyscraper Grid Tower */}
        <mesh>
          <boxGeometry args={[mountain.radius * 1.2 + 0.06, mountain.height, mountain.radius * 1.2 + 0.06]} />
          <meshBasicMaterial
            ref={towerWireRef}
            color={mountain.x > 0 ? '#ffe600' : '#39ff14'}
            wireframe={true}
            transparent={true}
            opacity={0.75}
          />
        </mesh>
      </group>
    </group>
  );
}
