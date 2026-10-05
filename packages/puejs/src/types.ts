import type { PueError } from "./errors";
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

export type EmitterState = "idle" | "suspended" | "running" | "destroyed";

export interface EmitterOptions {
  preset?: PresetName | AcousticProfile;
  odors?: readonly Odor[];
  pitch?: number | PitchRange;
  resonance?: number;
  duration?: number;
  volume?: number;
  tonnage?: TonnageCurveName | TonnageCurve;
  threshold?: number;
  throttle?: ThrottleStrategy;
  respectReducedMotion?: boolean;
  autoUnlock?: boolean;
  audioContext?: AudioContext;
}

/** Options after preset merging and defaults. */
export interface ResolvedOptions {
  readonly odors: readonly Odor[];
  readonly pitch: PitchRange;
  readonly resonance: number;
  readonly duration: number;
  readonly volume: number;
  readonly tonnage: TonnageCurveName | TonnageCurve;
  readonly threshold: number;
  readonly throttle: ThrottleStrategy;
  readonly respectReducedMotion: boolean;
  readonly autoUnlock: boolean;
  readonly audioContext: AudioContext | undefined;
}

export interface EmissionInput {
  tonnage?: number;
  odor?: Odor;
}

export interface EmissionEvent {
  tonnage: number;
  velocity: number;
  direction: 1 | -1;
  pitch: number;
  odor: string;
  latency: number;
  timestamp: number;
}

export interface EmitterEvents {
  emit: EmissionEvent;
  statechange: { previous: EmitterState; current: EmitterState };
  unlock: { context: AudioContext };
  error: PueError;
}

export type EmitterEventHandler<E extends keyof EmitterEvents> = (payload: EmitterEvents[E]) => void;

export interface Emitter {
  readonly state: EmitterState;
  readonly context: AudioContext | null;
  readonly options: ResolvedOptions;
  start(): Promise<void>;
  stop(): void;
  update(options: Partial<EmitterOptions>): void;
  emit(input?: EmissionInput): void;
  on<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>): () => void;
  off<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>): void;
  destroy(): void;
}
