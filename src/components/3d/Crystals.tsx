import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Crystal } from '../../store/types';
import { getWorld, renderPlayer } from '../../game';
import { commitInstances } from './instancing';
import { facetShadingGlsl } from './facetShading';
import { MAGNET_CONFIG } from '../../config/tuning';
import { useGameStore } from '../../store/useGameStore';

// Pool size; the spawn horizon holds up to ~20 crystals plus a few finishing their pickup animation
const MAX_CRYSTALS = 48;

const BASE_Y = 0.1;
const BOB_SPEED = 4.5;
const BOB_AMOUNT = 0.12;
const SPIN_SPEED = 2.5;
const COLLECT_DURATION = 0.26;
// The pickup flight eases out at the magnet's pull rate, so a magnet-pulled crystal keeps its speed into the pickup
// instead of slowing down where the collection check fires (about the middle lane when pulled from the far one)
const COLLECT_EASE_END = 1 - Math.exp(-MAGNET_CONFIG.pullRate * COLLECT_DURATION);
const COLLECT_SPIN_SPEED = 25;
const COLLECT_TARGET_Y = 0.05;
const RING_Y = BASE_Y - 0.4;

interface CrystalVisual {
  phase: number;
  rotationY: number;
  lastSeenFrame: number;
  /** Pickup flight, animated relative to the ship (like the magnet pull before it) */
  collect: { offsetX: number; offsetZ: number; startY: number; ringX: number; ringZ: number; elapsed: number } | null;
}

// Parsed once per distinct crystal color
const colorCache = new Map<string, THREE.Color>();
function cachedColor(hex: string): THREE.Color {
  let color = colorCache.get(hex);
  if (!color) {
    color = new THREE.Color(hex);
    colorCache.set(hex, color);
  }
  return color;
}

// Brilliant cut, table up: a flat octagonal table, a sloped crown down to the girdle, then a pointed pavilion
const GIRDLE_SEGMENTS = 8;
// Visual size only; pickup range is decided by the simulation
const GEM_SCALE = 0.75;
const GIRDLE_RADIUS = 0.26;
const TABLE_RADIUS = GIRDLE_RADIUS * 0.45;
const CROWN_HEIGHT = 0.14;
const PAVILION_DEPTH = 0.5;

function createBrilliantGeometry(): THREE.BufferGeometry {
  const ring = (radius: number, y: number) =>
    Array.from({ length: GIRDLE_SEGMENTS }, (_, i) => {
      const angle = (i / GIRDLE_SEGMENTS) * Math.PI * 2;
      return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius);
    });
  const girdle = ring(GIRDLE_RADIUS, 0);
  const table = ring(TABLE_RADIUS, CROWN_HEIGHT);
  const tableCenter = new THREE.Vector3(0, CROWN_HEIGHT, 0);
  const culet = new THREE.Vector3(0, -PAVILION_DEPTH, 0);

  // Unshared vertices, so every facet gets its own flat normal
  const points: THREE.Vector3[] = [];
  for (let i = 0; i < GIRDLE_SEGMENTS; i++) {
    const next = (i + 1) % GIRDLE_SEGMENTS;
    points.push(tableCenter, table[next], table[i]);
    points.push(table[i], table[next], girdle[next]);
    points.push(table[i], girdle[next], girdle[i]);
    points.push(girdle[i], girdle[next], culet);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  geometry.computeVertexNormals();
  // Centered vertically, so the gem bobs around the same point as before
  geometry.translate(0, (PAVILION_DEPTH - CROWN_HEIGHT) / 2, 0);
  geometry.scale(GEM_SCALE, GEM_SCALE, GEM_SCALE);
  return geometry;
}

const _yAxis = new THREE.Vector3(0, 1, 0);
const _xAxis = new THREE.Vector3(1, 0, 0);

// Thickness of the HIGH quality outline, built as thin prisms along the cut's edges (WebGL lines are 1px wide and
// cannot be instanced)
const EDGE_RADIUS = 0.007;
const EDGE_SIDES = 3;

function createEdgeGeometry(gem: THREE.BufferGeometry): THREE.BufferGeometry {
  // Only real facet boundaries; the flat crown trapezoids' diagonals are skipped
  const edges = new THREE.EdgesGeometry(gem, 1);
  const position = edges.getAttribute('position');
  const start = new THREE.Vector3();
  const end = new THREE.Vector3();
  const direction = new THREE.Vector3();
  const u = new THREE.Vector3();
  const v = new THREE.Vector3();
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < position.count; i += 2) {
    start.fromBufferAttribute(position, i);
    end.fromBufferAttribute(position, i + 1);
    direction.subVectors(end, start).normalize();
    u.crossVectors(direction, Math.abs(direction.y) < 0.9 ? _yAxis : _xAxis).normalize();
    v.crossVectors(direction, u);

    const offsets = Array.from({ length: EDGE_SIDES }, (_, k) => {
      const angle = (k / EDGE_SIDES) * Math.PI * 2;
      return u.clone().multiplyScalar(Math.cos(angle) * EDGE_RADIUS).addScaledVector(v, Math.sin(angle) * EDGE_RADIUS);
    });
    for (let k = 0; k < EDGE_SIDES; k++) {
      const a = offsets[k];
      const b = offsets[(k + 1) % EDGE_SIDES];
      points.push(start.clone().add(a), end.clone().add(a), end.clone().add(b));
      points.push(start.clone().add(a), end.clone().add(b), start.clone().add(b));
    }
  }

  edges.dispose();
  return new THREE.BufferGeometry().setFromPoints(points);
}

type GraphicsQuality = 'HIGH' | 'LOW';

interface CrystalLook {
  /** Emissive luminance every crystal color is brought to, so all colors glow alike */
  glowLuminance: number;
  emissiveIntensity: number;
  /** Below 1 the facets are drawn as additive glass, so the back facets show through */
  facetOpacity: number;
  /** Bright outline along the cut's edges */
  edges: boolean;
}

const CRYSTAL_LOOKS: Record<GraphicsQuality, CrystalLook> = {
  // Solid, crisp gems with little bloom
  LOW: { glowLuminance: 0.4, emissiveIntensity: 1.0, facetOpacity: 1, edges: false },
  // See-through glass with a glowing outline
  HIGH: { glowLuminance: 0.5, emissiveIntensity: 1.3, facetOpacity: 0.45, edges: true },
};

// Equalizing range: cyan and yellow are dimmed, magenta and purple (far less luminance at the same intensity) lifted
const GLOW_MIN_SCALE = 0.5;
// Caps the lift for very dark hues, which would otherwise blow out towards white
const GLOW_MAX_SCALE = 2.5;
// Darkest facet relative to the brightest; lower means a sharper, more glass-like cut
const FACET_MIN_BRIGHTNESS = 0.2;
// Outline color: the crystal's hue pushed towards white, bright enough to bloom
const EDGE_LUMINANCE = 0.9;
const EDGE_WHITE_MIX = 0.45;
const EDGE_INTENSITY = 1.8;

/** GLSL factor bringing the per-instance color vColor to the target luminance */
function luminanceEqualizer(targetLuminance: number): string {
  return `clamp(${targetLuminance.toFixed(2)} / max(luminance(vColor.rgb), 0.01), ${GLOW_MIN_SCALE.toFixed(2)}, ${GLOW_MAX_SCALE.toFixed(2)})`;
}

/**
 * Facet material: tints the emissive term with the per-instance color (equalized in luminance), so one material
 * serves every crystal color, and shades each facet from a fixed view-space key light, so the cut reads the same
 * under any scene lighting
 */
function createFacetMaterial(quality: GraphicsQuality): THREE.MeshStandardMaterial {
  const look = CRYSTAL_LOOKS[quality];
  const glass = look.facetOpacity < 1;
  const material = new THREE.MeshStandardMaterial({
    emissive: '#ffffff',
    emissiveIntensity: look.emissiveIntensity,
    roughness: 0.1,
    metalness: 0.9,
    flatShading: true,
    transparent: glass,
    opacity: look.facetOpacity,
    blending: glass ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: !glass,
    side: glass ? THREE.DoubleSide : THREE.FrontSide,
  });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
#ifdef USE_COLOR
  totalEmissiveRadiance *= vColor.rgb * ${luminanceEqualizer(look.glowLuminance)};
#endif
${facetShadingGlsl(FACET_MIN_BRIGHTNESS)}`
    );
  };
  // The shader patch differs per quality, so each variant needs its own compiled program
  material.customProgramCacheKey = () => `crystal-facets-${quality}`;
  return material;
}

function createEdgeMaterial(): THREE.MeshBasicMaterial {
  const material = new THREE.MeshBasicMaterial({ toneMapped: false, side: THREE.DoubleSide });
  material.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <color_fragment>',
      `#ifdef USE_COLOR
  diffuseColor.rgb *= mix(vColor.rgb * ${luminanceEqualizer(EDGE_LUMINANCE)}, vec3(1.0), ${EDGE_WHITE_MIX.toFixed(2)}) * ${EDGE_INTENSITY.toFixed(2)};
#endif`
    );
  };
  material.customProgramCacheKey = () => 'crystal-edges';
  return material;
}

const NO_CRYSTALS: readonly Crystal[] = [];

const _matrix = new THREE.Matrix4();
const _position = new THREE.Vector3();
const _scale = new THREE.Vector3();
const _rotation = new THREE.Quaternion();
const _ringColor = new THREE.Color();
const _ringRotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);

/**
 * All crystals rendered as instanced meshes: spinning brilliant-cut gem, its outline on HIGH quality, and a floor halo.
 * Positions come from the simulation; crystals homing in on the ship are drawn relative to its interpolated position.
 */
export default function Crystals() {
  const gemRef = useRef<THREE.InstancedMesh>(null);
  const edgeRef = useRef<THREE.InstancedMesh>(null);
  const ringRef = useRef<THREE.InstancedMesh>(null);
  const visuals = useRef(new Map<string, CrystalVisual>());
  const frame = useRef(0);
  const graphicsQuality = useGameStore((state) => state.graphicsQuality);
  const look = CRYSTAL_LOOKS[graphicsQuality];

  const gemGeometry = useMemo(() => createBrilliantGeometry(), []);
  const edgeGeometry = useMemo(() => createEdgeGeometry(gemGeometry), [gemGeometry]);
  const facetMaterial = useMemo(() => createFacetMaterial(graphicsQuality), [graphicsQuality]);
  const edgeMaterial = useMemo(() => createEdgeMaterial(), []);

  useEffect(() => () => {
    gemGeometry.dispose();
    edgeGeometry.dispose();
    edgeMaterial.dispose();
  }, [gemGeometry, edgeGeometry, edgeMaterial]);
  useEffect(() => () => facetMaterial.dispose(), [facetMaterial]);

  useFrame((state, delta) => {
    const gems = gemRef.current;
    const rings = ringRef.current;
    if (!gems || !rings) return;
    // Mounted only on HIGH quality
    const edges = edgeRef.current;

    const world = getWorld();
    const crystals = world?.crystals ?? NO_CRYSTALS;
    const shipX = renderPlayer.x;
    const playerZ = renderPlayer.z;
    // Simulated ship position, for converting crystal positions into offsets from the ship
    const simShipX = world?.player.x ?? shipX;
    const simShipZ = world?.player.z ?? playerZ;
    const time = state.clock.getElapsedTime();
    const currentFrame = ++frame.current;
    let count = 0;

    for (const crystal of crystals) {
      if (count >= MAX_CRYSTALS) break;

      let visual = visuals.current.get(crystal.id);
      if (!visual) {
        visual = { phase: Math.random() * Math.PI * 2, rotationY: 0, lastSeenFrame: 0, collect: null };
        visuals.current.set(crystal.id, visual);
      }
      visual.lastSeenFrame = currentFrame;

      let scale = 1;
      let fade = 1;

      if (!crystal.collected) {
        visual.rotationY = time * SPIN_SPEED + visual.phase;
        const bobY = BASE_Y + Math.sin(time * BOB_SPEED + visual.phase) * BOB_AMOUNT;
        if (crystal.magnetized) {
          // Homing crystals move with the ship, so they follow its interpolated position (raw steps would jitter)
          _position.set(shipX + crystal.x - simShipX, bobY, playerZ + crystal.z - simShipZ);
        } else {
          _position.set(crystal.x, bobY, crystal.z);
        }
      } else {
        // Homing pickup: fly into the ship while shrinking and spinning fast
        if (!visual.collect) {
          const startY = BASE_Y + Math.sin(time * BOB_SPEED + visual.phase) * BOB_AMOUNT;
          visual.collect = {
            offsetX: crystal.x - simShipX,
            offsetZ: crystal.z - simShipZ,
            startY,
            ringX: crystal.x,
            ringZ: crystal.z,
            elapsed: 0,
          };
        }
        const pickup = visual.collect;
        pickup.elapsed += delta;
        const progress = pickup.elapsed / COLLECT_DURATION;
        if (progress >= 1) continue;

        scale = 1 - progress;
        fade = 1 - progress;
        const travel = (1 - Math.exp(-MAGNET_CONFIG.pullRate * pickup.elapsed)) / COLLECT_EASE_END;
        visual.rotationY += delta * COLLECT_SPIN_SPEED;
        _position.set(
          shipX + pickup.offsetX * (1 - travel),
          THREE.MathUtils.lerp(pickup.startY, COLLECT_TARGET_Y, travel),
          playerZ + pickup.offsetZ * (1 - travel)
        );
      }

      const color = cachedColor(crystal.color);
      _rotation.setFromAxisAngle(_yAxis, visual.rotationY);
      _matrix.compose(_position, _rotation, _scale.setScalar(scale));
      gems.setMatrixAt(count, _matrix);
      gems.setColorAt(count, color);
      edges?.setMatrixAt(count, _matrix);
      edges?.setColorAt(count, color);

      // The halo follows the crystal, then stays on the floor where it was picked up; fading is approximated by darkening
      _position.set(visual.collect?.ringX ?? _position.x, RING_Y, visual.collect?.ringZ ?? _position.z);
      rings.setMatrixAt(count, _matrix.compose(_position, _ringRotation, _scale.setScalar(scale)));
      rings.setColorAt(count, _ringColor.copy(color).multiplyScalar(fade));

      count++;
    }

    // Drop visual state of crystals that left the track
    for (const [id, visual] of visuals.current) {
      if (visual.lastSeenFrame !== currentFrame) visuals.current.delete(id);
    }

    commitInstances(gems, count);
    if (edges) commitInstances(edges, count);
    commitInstances(rings, count);
  });

  // frustumCulled is off: the bounding sphere would be computed once and go stale as instances move
  return (
    <group>
      <instancedMesh
        ref={gemRef}
        args={[gemGeometry, facetMaterial, MAX_CRYSTALS]}
        count={0}
        frustumCulled={false}
        // A new material on a quality switch: recreate the mesh so it picks it up
        key={graphicsQuality}
      />

      {look.edges && (
        <instancedMesh ref={edgeRef} args={[edgeGeometry, edgeMaterial, MAX_CRYSTALS]} count={0} frustumCulled={false} />
      )}

      <instancedMesh ref={ringRef} args={[undefined, undefined, MAX_CRYSTALS]} count={0} frustumCulled={false}>
        <ringGeometry args={[0.22 * GEM_SCALE, 0.27 * GEM_SCALE, 32]} />
        <meshBasicMaterial transparent opacity={0.3} />
      </instancedMesh>
    </group>
  );
}
