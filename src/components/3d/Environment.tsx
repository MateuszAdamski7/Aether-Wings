import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles, type SparklesProps } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';
import { renderPlayer } from '../../game';
import { sampleEnvColors, getMountainWireColor, ENV_PALETTE } from '../../config/sectorPalettes';

// Module-level scratch Color instances (zero allocations in frame loop)
const _targetBottom = new THREE.Color();
const _targetTop = new THREE.Color();
const _targetFogColor = new THREE.Color();
const _defaultBgColor = new THREE.Color('#03030c');

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

/**
 * drei's sparkle shader divides by the pixel's distance to the point center, which is 0 when a pixel lands exactly on it.
 * The resulting infinite alpha blends into NaN on the HIGH quality half-float buffer, and the mipmap bloom spreads that one
 * pixel over the whole screen: a single black frame. Clamping alpha to [0, 1] matches what the 8-bit LOW buffer does anyway.
 */
function clampSparkleAlpha(shader: THREE.WebGLProgramParametersWithUniforms): void {
  shader.fragmentShader = shader.fragmentShader
    .replace('0.05 / distanceToCenter', '0.05 / max(distanceToCenter, 0.001)')
    .replace('vec4(vColor, strength * vOpacity)', 'vec4(vColor, clamp(strength * vOpacity, 0.0, 1.0))');
}

/** drei <Sparkles> with its default material swapped for one with the NaN-safe shader */
function SafeSparkles(props: SparklesProps) {
  const dpr = useThree((state) => state.viewport.dpr);
  return (
    <Sparkles {...props}>
      <sparklesImplMaterial transparent depthWrite={false} pixelRatio={dpr} onBeforeCompile={clampSparkleAlpha} />
    </Sparkles>
  );
}

// Stars fill a box (relative to the player) above eye level and ahead of the camera: below the horizon they cluttered
// the track, and next to the camera they grew into large blurry blobs (point size scales with 1 / distance)
const STARFIELD_POSITION: [number, number, number] = [0, 14, 70]; // y 4..24, z 10..130
const STARFIELD_SCALE: [number, number, number] = [60, 20, 120];

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
  const starColor1 = currentSector === 1 ? ENV_PALETTE.s1.stars1 : currentSector === 2 ? ENV_PALETTE.s2.stars1 : ENV_PALETTE.s3.stars1;
  const starColor2 = currentSector === 1 ? ENV_PALETTE.s1.stars2 : currentSector === 2 ? ENV_PALETTE.s2.stars2 : ENV_PALETTE.s3.stars2;

  // Update shader uniforms and followGroup Z position
  useFrame((state, delta) => {
    const playerZ = renderPlayer.z;
    const dt = Math.min(delta, 0.1);

    // Continuous sector-based color interpolation based on playerZ coordinate (zero allocations)
    sampleEnvColors(playerZ, _targetBottom, _targetTop, _targetFogColor);

    if (sunMaterialRef.current) {
      // Animate stripes
      sunMaterialRef.current.uniforms.uTime.value += dt;

      const currentBottom = sunMaterialRef.current.uniforms.uColorBottom.value as THREE.Color;
      const currentTop = sunMaterialRef.current.uniforms.uColorTop.value as THREE.Color;
      currentBottom.copy(_targetBottom);
      currentTop.copy(_targetTop);
    }

    if (state.scene.fog) {
      state.scene.fog.color.lerp(_targetFogColor, dt * 3.0);
    }
    // Sync background clear color with fog
    state.scene.background = state.scene.fog?.color ?? _defaultBgColor;

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
        <SafeSparkles
          count={graphicsQuality === 'HIGH' ? 250 : 80}
          scale={STARFIELD_SCALE}
          position={STARFIELD_POSITION}
          size={2.5}
          speed={0.3}
          noise={1}
          color={starColor1}
        />
        <SafeSparkles
          count={graphicsQuality === 'HIGH' ? 200 : 60}
          scale={STARFIELD_SCALE}
          position={STARFIELD_POSITION}
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
    
    const playerZ = renderPlayer.z;
    const dt = Math.min(delta, 0.1);
    
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
    const isPyramid = absoluteZ < 1200;
    if (pyramidGroupRef.current) pyramidGroupRef.current.visible = isPyramid;
    if (towerGroupRef.current) towerGroupRef.current.visible = !isPyramid;

    // Smoothly update neon outline colors at biome boundaries (zero allocations)
    const targetColor = getMountainWireColor(absoluteZ, mountain.x > 0);
    if (isPyramid) {
      if (pyramidWireRef.current) {
        pyramidWireRef.current.color.lerp(targetColor, dt * 4.0);
      }
    } else {
      if (towerWireRef.current) {
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
