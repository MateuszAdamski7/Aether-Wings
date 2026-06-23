import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';

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

export default function Environment() {
  const sunMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const followGroupRef = useRef<THREE.Group>(null);

  // Reactively subscribe for star color switches (infrequent re-renders)
  const currentSector = useGameStore((state) => state.currentSector);
  
  // Colors for star sparkles in each sector biome
  const starColor1 = currentSector === 1 ? '#00f3ff' : currentSector === 2 ? '#39ff14' : '#ff0000';
  const starColor2 = currentSector === 1 ? '#ff007f' : currentSector === 2 ? '#ffe600' : '#7a00ff';

  // Update shader uniforms and followGroup Z position
  useFrame((state, delta) => {
    const { playerZ, slowMoActiveTime } = useGameStore.getState();
    const slowMoActive = slowMoActiveTime > 0;
    const dt = Math.min(delta, 0.1) * (slowMoActive ? 0.65 : 1.0);

    // Continuous sector-based color interpolation based on playerZ coordinate
    const s1Bottom = new THREE.Color('#ff8c00');
    const s1Top = new THREE.Color('#ff0080');
    const s1Fog = new THREE.Color('#03030c');

    const s2Bottom = new THREE.Color('#ff5500');
    const s2Top = new THREE.Color('#ffe600');
    const s2Fog = new THREE.Color('#011408');

    const s3Bottom = new THREE.Color('#7a00ff');
    const s3Top = new THREE.Color('#ff003c');
    const s3Fog = new THREE.Color('#090214');

    let targetBottom = new THREE.Color();
    let targetTop = new THREE.Color();
    let targetFogColor = new THREE.Color();

    if (playerZ < 1000) {
      targetBottom.copy(s1Bottom);
      targetTop.copy(s1Top);
      targetFogColor.copy(s1Fog);
    } else if (playerZ < 1300) {
      // Transition Sector 1 -> 2 over 300 meters
      const t = (playerZ - 1000) / 300;
      targetBottom.lerpColors(s1Bottom, s2Bottom, t);
      targetTop.lerpColors(s1Top, s2Top, t);
      targetFogColor.lerpColors(s1Fog, s2Fog, t);
    } else if (playerZ < 2600) {
      targetBottom.copy(s2Bottom);
      targetTop.copy(s2Top);
      targetFogColor.copy(s2Fog);
    } else if (playerZ < 2900) {
      // Transition Sector 2 -> 3 over 300 meters
      const t = (playerZ - 2600) / 300;
      targetBottom.lerpColors(s2Bottom, s3Bottom, t);
      targetTop.lerpColors(s2Top, s3Top, t);
      targetFogColor.lerpColors(s2Fog, s3Fog, t);
    } else {
      targetBottom.copy(s3Bottom);
      targetTop.copy(s3Top);
      targetFogColor.copy(s3Fog);
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

  // Generate mountain/tower layout positions on the sides
  const mountains = useMemo(() => {
    const arr = [];
    const count = 12; // 6 on each side
    const spacing = 45; // space along Z
    for (let i = 0; i < count; i++) {
      const isRight = i % 2 === 0;
      const x = isRight ? 12 : -12;
      const index = Math.floor(i / 2);
      const zOffset = index * spacing;
      
      const height = 6 + Math.random() * 8;
      const radius = 3 + Math.random() * 4;
      const color = isRight ? '#ff007f' : '#00f3ff';

      arr.push({ x, zOffset, height, radius, color });
    }
    return arr;
  }, []);

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
          count={250}
          scale={[60, 30, 180]}
          position={[0, 10, 40]} // Relative to group
          size={2.5}
          speed={0.3}
          noise={1}
          color={starColor1}
        />
        <Sparkles
          count={200}
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
      {mountains.map((mountain, index) => {
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
    const isPyramid = absoluteZ < 1200;
    if (pyramidGroupRef.current) pyramidGroupRef.current.visible = isPyramid;
    if (towerGroupRef.current) towerGroupRef.current.visible = !isPyramid;

    // Smoothly update neon outline colors at biome boundaries
    if (isPyramid) {
      if (pyramidWireRef.current) {
        // Sector 1: Left Cyan, Right Pink
        const targetColor = new THREE.Color(mountain.x > 0 ? '#ff007f' : '#00f3ff');
        pyramidWireRef.current.color.lerp(targetColor, dt * 4.0);
      }
    } else {
      if (towerWireRef.current) {
        // Sector 2/3 colors
        let targetColor = new THREE.Color();
        if (absoluteZ >= 2800) {
          // Sector 3: Left Red, Right Violet
          targetColor.setStyle(mountain.x > 0 ? '#9d00ff' : '#ff0000');
        } else {
          // Sector 2: Left Green, Right Yellow
          targetColor.setStyle(mountain.x > 0 ? '#ffe600' : '#39ff14');
        }
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
