import type { Odor } from "./odor";

export type { Odor };

export type TonnageCurveName = "linear" | "logarithmic" | "exponential";

/** Maps a smoothed scroll velocity, in px/s, to a tonnage between 0 and 1. */
export type TonnageCurve = (velocity: number) => number;

export type ThrottleStrategy = "velocity" | "distance" | number;

export type PresetName = "organic" | "crisp" | "deep" | "discreet";

export interface PitchRange {
  readonly min: number;
  readonly max: number;
}

/** The full set of parameters that shape an emission. */
export interface AcousticProfile {
  readonly odors: readonly Odor[];
  readonly pitch: number | PitchRange;
  readonly resonance: number;
  readonly duration: number;
  readonly volume: number;
  readonly tonnage: TonnageCurveName | TonnageCurve;
}
