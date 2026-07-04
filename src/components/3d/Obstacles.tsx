import { useGameStore } from '../../store/useGameStore';
import type { Obstacle } from '../../store/useGameStore';
import { getSectorAtZ } from '../../config/gameConfig';

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
  const sector = getSectorAtZ(obstacle.z);
  const { hazard, accent } = sector.colors;

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
          color={hazard} 
          wireframe={true}
        />
      </mesh>

      {/* 3. Small hazard lights or accents */}
      <mesh position={[0, obstacle.height / 2 - 0.1, 0.22]}>
        <boxGeometry args={[obstacle.width * 0.4, 0.08, 0.02]} />
        <meshBasicMaterial color={accent} />
      </mesh>
    </group>
  );
}
