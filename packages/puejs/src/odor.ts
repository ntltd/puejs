import { PueError } from "./errors";

/** A sample the emitter can play. Built-in odors inline their audio as a data URI. */
export interface Odor {
  readonly name: string;
  /** URL or data URI of an audio file the browser can decode. */
  readonly src: string;
  /** Tonnage range for which the odor is eligible. */
  readonly tonnage: readonly [number, number];
}

export interface OdorDefinition {
  name: string;
  src: string;
  tonnage?: readonly [number, number];
}

function invalid(message: string): never {
  throw new PueError("E_INVALID_OPTION", message);
}

/** Declares an odor from a sample URL or data URI. */
export function defineOdor(definition: OdorDefinition): Odor {
  const { name, src, tonnage = [0, 1] } = definition;
  if (typeof name !== "string" || name.length === 0) invalid('An odor needs a non-empty "name".');
  if (typeof src !== "string" || src.length === 0) invalid(`The odor "${name}" needs a non-empty "src".`);
  const [min, max] = tonnage;
  if (!(Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max <= 1 && min <= max)) {
    invalid(`The odor "${name}" needs a "tonnage" range with 0 <= min <= max <= 1.`);
  }
  return Object.freeze({ name, src, tonnage: Object.freeze([min, max] as const) });
}

export function isOdor(value: unknown): value is Odor {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.src === "string" &&
    Array.isArray(candidate.tonnage) &&
    candidate.tonnage.length === 2
  );
}
