import { describe, expect, it } from "vitest";
import { defineOdor } from "../src/odor";
import { selectOdor } from "../src/selection";

const low = defineOdor({ name: "low", src: "/low.mp3", tonnage: [0, 0.6] });
const high = defineOdor({ name: "high", src: "/high.mp3", tonnage: [0.4, 1] });
const top = defineOdor({ name: "top", src: "/top.mp3", tonnage: [0.8, 1] });

describe("selectOdor", () => {
  it("picks the odor whose range contains the tonnage", () => {
    expect(selectOdor([low, high], 0.2, () => 0)).toBe(low);
    expect(selectOdor([low, high], 0.9, () => 0)).toBe(high);
  });

  it("uses the random source when ranges overlap", () => {
    expect(selectOdor([low, high], 0.5, () => 0)).toBe(low);
    expect(selectOdor([low, high], 0.5, () => 0.99)).toBe(high);
  });

  it("falls back to the closest range", () => {
    expect(selectOdor([top], 0.1, () => 0)).toBe(top);
    expect(selectOdor([low, top], 0.7, () => 0)).toBe(low);
  });

  it("returns undefined without odors", () => {
    expect(selectOdor([], 0.5, () => 0)).toBeUndefined();
  });
});
