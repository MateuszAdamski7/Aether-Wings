import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../../store/useGameStore';

// Custom shader for the scrolling cyberpunk runway grid
// Draws the roadbed, horizontal scrolling grid lines, and dashed lane dividers
const TrackShader = {
  uniforms: {
    uPlayerZ: { value: 0 },
    uThemeColor: { value: new THREE.Color('#9d00ff') } // Dynamic uniform
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
    uniform float uPlayerZ;
    uniform vec3 uThemeColor;

    void main() {
      // Base dark roadbed color (retro deep space blue-black)
      vec3 roadColor = vec3(0.015, 0.015, 0.06);
      
      // Calculate world Z position along the track (plane length is 350)
      float z = -uPlayerZ + (vUv.y * 350.0);
      
      // 1. Horizontal grid lines (spaced every 6 units)
      float lineSpacing = 6.0;
      float gridFraction = fract(z / lineSpacing);
      // Sharp step function to draw the grid line with a thickness of ~0.08 units
      float horizontalLine = step(0.985, gridFraction);
      
      // 2. Vertical lane division lines (at X = -1.2 and X = 1.2 in world coordinates)
      // Since track width is 7.2, and X ranges from -3.6 to +3.6:
      // Lane 1 divider: X = -1.2 -> vUv.x = (-1.2 - (-3.6)) / 7.2 = 0.3333
      // Lane 2 divider: X = 1.2  -> vUv.x = (1.2 - (-3.6)) / 7.2 = 0.6666
      float distToLine1 = abs(vUv.x - 0.3333);
      float distToLine2 = abs(vUv.x - 0.6666);
      float laneDividerDist = min(distToLine1, distToLine2);
      float verticalLine = step(laneDividerDist, 0.0035);
      
      // Make lane dividers dashed (dashed every 12 units along Z: 6 units line, 6 units gap)
      float dash = step(0.5, fract(z / 12.0));
      verticalLine *= dash;
      
      // Blend grid intensities (horizontal lines are brighter, dividers are subtle)
      float gridIntensity = max(horizontalLine * 0.45, verticalLine * 0.2);
      vec3 finalColor = mix(roadColor, uThemeColor, gridIntensity);
      
      // Moiré Prevention Filter:
      // Fade out grid lines in the far distance to prevent pixel aliasing (horizontal flickering)
      // vUv.y is 0 at the camera (bottom) and 1 at the horizon (top)
      float fade = 1.0 - smoothstep(0.35, 0.85, vUv.y);
      finalColor = mix(roadColor, finalColor, fade);
      
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
};

export default function Track() {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const groupRef = useRef<THREE.Group>(null);
  const leftRailMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const rightRailMatRef = useRef<THREE.MeshBasicMaterial>(null);

  // Update uniforms and position with player's Z coordinate to scroll the grid lines
  useFrame(() => {
    const { playerZ } = useGameStore.getState();

    // Continuous color definitions
    const s1Theme = new THREE.Color('#9d00ff'); // Violet
    const s1Left = new THREE.Color('#00f3ff');  // Cyan
    const s1Right = new THREE.Color('#ff007f'); // Hot Pink

    const s2Theme = new THREE.Color('#ff5500'); // Neon Orange
    const s2Left = new THREE.Color('#39ff14');  // Acid Green
    const s2Right = new THREE.Color('#ffe600'); // Solar Yellow

    const s3Theme = new THREE.Color('#7a00ff'); // Indigo Purple
    const s3Left = new THREE.Color('#ff0000');  // Crimson Red
    const s3Right = new THREE.Color('#9d00ff'); // Nebula Violet

    const targetTheme = new THREE.Color();
    const targetLeft = new THREE.Color();
    const targetRight = new THREE.Color();

    if (playerZ < 1000) {
      targetTheme.copy(s1Theme);
      targetLeft.copy(s1Left);
      targetRight.copy(s1Right);
    } else if (playerZ < 1300) {
      const t = (playerZ - 1000) / 300;
      targetTheme.lerpColors(s1Theme, s2Theme, t);
      targetLeft.lerpColors(s1Left, s2Left, t);
      targetRight.lerpColors(s1Right, s2Right, t);
    } else if (playerZ < 2600) {
      targetTheme.copy(s2Theme);
      targetLeft.copy(s2Left);
      targetRight.copy(s2Right);
    } else if (playerZ < 2900) {
      const t = (playerZ - 2600) / 300;
      targetTheme.lerpColors(s2Theme, s3Theme, t);
      targetLeft.lerpColors(s2Left, s3Left, t);
      targetRight.lerpColors(s2Right, s3Right, t);
    } else {
      targetTheme.copy(s3Theme);
      targetLeft.copy(s3Left);
      targetRight.copy(s3Right);
    }

    if (materialRef.current) {
      materialRef.current.uniforms.uPlayerZ.value = playerZ;
      const currentThemeColor = materialRef.current.uniforms.uThemeColor.value as THREE.Color;
      currentThemeColor.copy(targetTheme);
    }

    if (leftRailMatRef.current) {
      leftRailMatRef.current.color.copy(targetLeft);
    }

    if (rightRailMatRef.current) {
      rightRailMatRef.current.color.copy(targetRight);
    }

    if (groupRef.current) {
      groupRef.current.position.z = playerZ + 50;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 50]}>
      {/* 1. Optimized Main Runway with scrolling custom shader */}
      <mesh position={[0, -0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[7.2, 350]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={TrackShader.vertexShader}
          fragmentShader={TrackShader.fragmentShader}
          uniforms={TrackShader.uniforms}
        />
      </mesh>

      {/* 2. Glowing Neon Side Rails */}
      {/* Left side rail */}
      <mesh position={[-3.6, -0.45, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 350]} />
        <meshBasicMaterial ref={leftRailMatRef} color="#00f3ff" />
      </mesh>

      {/* Right side rail */}
      <mesh position={[3.6, -0.45, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.1, 0.1, 350]} />
        <meshBasicMaterial ref={rightRailMatRef} color="#ff007f" />
      </mesh>
    </group>
  );
}
