import { useGameStore } from '../../store/useGameStore';
import type { Obstacle } from '../../store/useGameStore';

export default function Obstacles() {
  const obstacles = useGameStore((state) => state.obstacles);

  return (
    <group>
      {obstacles.map((obs) => (
        <ObstacleInstance key={obs.id} obstacle={obs} />
      ))}
    </group>
  );
}

function ObstacleInstance({ obstacle }: { obstacle: Obstacle }) {
  // Set hazard color based on biome sector of this specific obstacle
  let hazardColor = '#ff0055'; // Sector 1: Magenta/Pink
  if (obstacle.z >= 2800) {
    hazardColor = '#9d00ff'; // Sector 3: Void Purple
  } else if (obstacle.z >= 1200) {
    hazardColor = '#ffaa00'; // Sector 2: Neon Yellow/Orange
  }

  const isSector2 = obstacle.z >= 1200 && obstacle.z < 2800;

  return (
    <group position={[obstacle.x, obstacle.height / 2 - 0.45, obstacle.z]}>
      {/* 1. Core mesh (semi-transparent dark block to block scenery) */}
      <mesh>
        <boxGeometry args={[obstacle.width, obstacle.height, 0.4]} />
        <meshStandardMaterial 
          color="#060613" 
          roughness={0.9} 
          transparent={true}
          opacity={0.8}
        />
      </mesh>

      {/* 2. Outer glowing wireframe outline */}
      <mesh>
        <boxGeometry args={[obstacle.width + 0.05, obstacle.height + 0.05, 0.45]} />
        <meshBasicMaterial 
          color={hazardColor} 
          wireframe={true}
        />
      </mesh>

      {/* 3. Small hazard lights or accents */}
      <mesh position={[0, obstacle.height / 2 - 0.1, 0.22]}>
        <boxGeometry args={[obstacle.width * 0.4, 0.08, 0.02]} />
        <meshBasicMaterial color={isSector2 ? '#39ff14' : '#ffe600'} />
      </mesh>
    </group>
  );
}
