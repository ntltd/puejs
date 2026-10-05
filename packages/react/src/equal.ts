import type { EmitterOptions, PitchRange } from "@puejs/core";

const samePitch = (a: EmitterOptions["pitch"], b: EmitterOptions["pitch"]): boolean => {
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  return (a as PitchRange).min === (b as PitchRange).min && (a as PitchRange).max === (b as PitchRange).max;
};

const sameList = (a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean =>
  a === b ||
  (a !== undefined && b !== undefined && a.length === b.length && a.every((item, index) => item === b[index]));

/**
 * Compares emitter options by value: pitch ranges structurally, odor lists element by element,
 * everything else (primitives, presets, curves, contexts) by identity.
 */
export function sameOptions(a: EmitterOptions, b: EmitterOptions): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof EmitterOptions>;
  for (const key of keys) {
    if (key === "pitch") {
      if (!samePitch(a.pitch, b.pitch)) return false;
    } else if (key === "odors") {
      if (!sameList(a.odors, b.odors)) return false;
    } else if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/** Provider defaults under the hook's options; the shared context only when the hook sets none. */
export function mergeOptions(
  defaults: EmitterOptions | undefined,
  options: EmitterOptions,
  audioContext?: AudioContext,
): EmitterOptions {
  const merged: EmitterOptions = { ...defaults, ...options };
  if (audioContext && merged.audioContext === undefined) merged.audioContext = audioContext;
  return merged;
}
