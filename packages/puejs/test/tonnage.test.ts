import { describe, expect, it } from "vitest";
import { PueError } from "../src/errors";
import { MAX_VELOCITY, computeTonnage, defineTonnageCurve } from "../src/tonnage";

describe("computeTonnage", () => {
  it("is 0 at or below the threshold and 1 at or above the maximum", () => {
    for (const curve of ["linear", "logarithmic", "exponential"] as const) {
      expect(computeTonnage(80, 80, curve)).toBe(0);
      expect(computeTonnage(10, 80, curve)).toBe(0);
      expect(computeTonnage(MAX_VELOCITY, 80, curve)).toBe(1);
      expect(computeTonnage(MAX_VELOCITY * 2, 80, curve)).toBe(1);
    }
  });

  it("applies the named curves", () => {
    expect(computeTonnage(1500, 0, "linear")).toBeCloseTo(0.5, 5);
    expect(computeTonnage(1500, 0, "logarithmic")).toBeCloseTo(Math.log10(5.5), 5);
    expect(computeTonnage(1500, 0, "exponential")).toBeCloseTo(0.25, 5);
  });

  it("clamps custom curves to [0, 1]", () => {
    expect(computeTonnage(500, 80, () => 2)).toBe(1);
    expect(computeTonnage(500, 80, () => -1)).toBe(0);
    expect(computeTonnage(500, 80, () => Number.NaN)).toBe(0);
    expect(computeTonnage(500, 80, (velocity) => velocity / 1000)).toBe(0.5);
  });
});

describe("defineTonnageCurve", () => {
  it("returns the curve", () => {
    const curve = (velocity: number) => velocity / 3000;
    expect(defineTonnageCurve(curve)).toBe(curve);
  });

  it("rejects non-functions", () => {
    expect(() => defineTonnageCurve("fast" as never)).toThrow(PueError);
  });
});
