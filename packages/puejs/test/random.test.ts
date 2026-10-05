import { describe, expect, it } from "vitest";
import { createRandom } from "../src/random";

const take = (random: () => number, count: number): number[] => Array.from({ length: count }, () => random());

describe("createRandom", () => {
  it("is deterministic for a given seed", () => {
    expect(take(createRandom(42), 5)).toEqual(take(createRandom(42), 5));
  });

  it("differs between seeds", () => {
    expect(take(createRandom(1), 5)).not.toEqual(take(createRandom(2), 5));
  });

  it("returns values in [0, 1)", () => {
    for (const value of take(createRandom(), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
