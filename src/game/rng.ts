/**
 * Mulberry32: fast, deterministic 32-bit pseudo-random number generator.
 * Produces values in range [0, 1).
 */
export function createRNG(seed: number = Date.now()): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
