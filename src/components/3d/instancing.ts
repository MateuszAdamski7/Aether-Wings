import type * as THREE from 'three';

/** Sets the visible instance count and flags the written instance buffers for upload */
export function commitInstances(mesh: THREE.InstancedMesh, count: number): void {
  mesh.count = count;
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}
