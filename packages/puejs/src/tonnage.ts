import { PueError } from "./errors";
import type { TonnageCurve, TonnageCurveName } from "./types";

/** Velocity, in px/s, at which tonnage saturates. */
export const MAX_VELOCITY = 3000;

const clamp01 = (value: number): number => (Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value)));

export function computeTonnage(
  velocity: number,
  threshold: number,
  curve: TonnageCurveName | TonnageCurve,
): number {
  if (typeof curve === "function") return clamp01(curve(velocity));
  const x = clamp01((velocity - threshold) / (MAX_VELOCITY - threshold));
  switch (curve) {
    case "linear":
      return x;
    case "exponential":
      return x * x;
    case "logarithmic":
      return Math.log10(1 + 9 * x);
  }
}

/** Declares a custom mapping from velocity to tonnage. */
export function defineTonnageCurve(curve: TonnageCurve): TonnageCurve {
  if (typeof curve !== "function") {
    throw new PueError("E_INVALID_OPTION", "A tonnage curve must be a function of the velocity.");
  }
  return curve;
}
