import { PueError } from "./errors";
import { isOdor } from "./odor";
import { presets } from "./presets";
import { MAX_VELOCITY } from "./tonnage";
import type {
  AcousticProfile,
  EmitterOptions,
  Odor,
  PitchRange,
  PresetName,
  ResolvedOptions,
  ThrottleStrategy,
  TonnageCurve,
  TonnageCurveName,
} from "./types";

export const DEFAULT_THRESHOLD = 80;

// Declared as a function so that TypeScript treats calls as never returning.
function invalid(option: string, expected: string): never {
  throw new PueError("E_INVALID_OPTION", `Invalid option "${option}": expected ${expected}.`);
}

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function assertOptionsObject(value: unknown): asserts value is EmitterOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid("options", "an object");
}

const unitInterval = (option: string, value: unknown): number =>
  isFiniteNumber(value) && value >= 0 && value <= 1 ? value : invalid(option, "a number between 0 and 1");

const positive = (option: string, value: unknown): number =>
  isFiniteNumber(value) && value > 0 ? value : invalid(option, "a positive number");

const boolean = (option: string, value: unknown): boolean =>
  typeof value === "boolean" ? value : invalid(option, "a boolean");

function pitchRange(value: unknown): PitchRange {
  if (isFiniteNumber(value) && value > 0) return { min: value, max: value };
  if (typeof value === "object" && value !== null) {
    const { min, max } = value as Record<string, unknown>;
    if (isFiniteNumber(min) && isFiniteNumber(max) && min > 0 && min <= max) return { min, max };
  }
  return invalid("pitch", "a positive number or a { min, max } range with 0 < min <= max");
}

function tonnageCurve(value: unknown): TonnageCurveName | TonnageCurve {
  if (typeof value === "function") return value as TonnageCurve;
  if (value === "linear" || value === "logarithmic" || value === "exponential") return value;
  return invalid("tonnage", '"linear", "logarithmic", "exponential" or a function');
}

function odorList(value: unknown): readonly Odor[] {
  if (!Array.isArray(value) || value.length === 0) invalid("odors", "a non-empty array of odors");
  const odors = value as unknown[];
  if (!odors.every(isOdor)) invalid("odors", "odors created with defineOdor() or imported from @puejs/core/odors");
  return Object.freeze([...(odors as Odor[])]);
}

function throttleStrategy(value: unknown): ThrottleStrategy {
  if (value === "velocity" || value === "distance") return value;
  if (isFiniteNumber(value) && value >= 0) return value;
  return invalid("throttle", '"velocity", "distance" or a non-negative number of milliseconds');
}

function profileFrom(preset: unknown): AcousticProfile {
  if (preset === undefined) return presets.organic;
  if (typeof preset === "string") {
    if (Object.prototype.hasOwnProperty.call(presets, preset)) return presets[preset as PresetName];
    return invalid("preset", `one of ${Object.keys(presets).join(", ")}`);
  }
  if (typeof preset === "object" && preset !== null) return preset as AcousticProfile;
  return invalid("preset", "a preset name or an acoustic profile");
}

/** Validates options, merges them over their preset and applies defaults. */
export function resolveOptions(options: EmitterOptions = {}): ResolvedOptions {
  assertOptionsObject(options);
  const profile = profileFrom(options.preset);
  const pick = (key: keyof AcousticProfile): unknown => options[key] ?? profile[key];

  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  if (!isFiniteNumber(threshold) || threshold < 0 || threshold >= MAX_VELOCITY) {
    invalid("threshold", `a number from 0 to ${MAX_VELOCITY} (exclusive)`);
  }
  const { audioContext } = options;
  if (audioContext !== undefined && (typeof audioContext !== "object" || audioContext === null)) {
    invalid("audioContext", "an AudioContext");
  }

  return Object.freeze({
    odors: odorList(pick("odors")),
    pitch: Object.freeze(pitchRange(pick("pitch"))),
    resonance: unitInterval("resonance", pick("resonance")),
    duration: positive("duration", pick("duration")),
    volume: unitInterval("volume", pick("volume")),
    tonnage: tonnageCurve(pick("tonnage")),
    threshold,
    throttle: throttleStrategy(options.throttle ?? "velocity"),
    respectReducedMotion: boolean("respectReducedMotion", options.respectReducedMotion ?? true),
    autoUnlock: boolean("autoUnlock", options.autoUnlock ?? true),
    audioContext,
  });
}
