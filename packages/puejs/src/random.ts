export type Random = () => number;

export const DEFAULT_SEED = 0x9e3779b9;

/** Seeded mulberry32 generator: identical seeds produce identical sequences. */
export function createRandom(seed: number = DEFAULT_SEED): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
