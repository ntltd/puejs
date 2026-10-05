import { defineOdor, type EmitterOptions } from "@puejs/core";
import { describe, expect, it } from "vitest";
import { mergeOptions, sameOptions } from "../src/equal";

const a = defineOdor({ name: "a", src: "/a.mp3" });
const b = defineOdor({ name: "b", src: "/b.mp3" });
const curve = (velocity: number) => velocity / 3000;

describe("sameOptions", () => {
  it("treats structurally equal options as equal", () => {
    expect(sameOptions({ preset: "crisp", volume: 0.5 }, { preset: "crisp", volume: 0.5 })).toBe(true);
    expect(sameOptions({ pitch: { min: 0.9, max: 1.1 } }, { pitch: { min: 0.9, max: 1.1 } })).toBe(true);
    expect(sameOptions({ odors: [a, b] }, { odors: [a, b] })).toBe(true);
    expect(sameOptions({ tonnage: curve }, { tonnage: curve })).toBe(true);
    expect(sameOptions({ volume: undefined }, {})).toBe(true);
  });

  it("detects real changes", () => {
    expect(sameOptions({ volume: 0.5 }, { volume: 0.6 })).toBe(false);
    expect(sameOptions({ pitch: { min: 0.9, max: 1.1 } }, { pitch: { min: 0.9, max: 1.2 } })).toBe(false);
    expect(sameOptions({ pitch: 1 }, { pitch: { min: 1, max: 1 } })).toBe(false);
    expect(sameOptions({ odors: [a, b] }, { odors: [b, a] })).toBe(false);
    expect(sameOptions({ odors: [a] }, { odors: [a, b] })).toBe(false);
    expect(sameOptions({ tonnage: curve }, { tonnage: (velocity: number) => velocity / 3000 })).toBe(false);
    expect(sameOptions({}, { threshold: 100 })).toBe(false);
  });
});

describe("mergeOptions", () => {
  it("merges defaults under options and injects the shared context", () => {
    const context = {} as AudioContext;
    const defaults: EmitterOptions = { preset: "deep", volume: 0.3 };
    expect(mergeOptions(defaults, { volume: 0.9 }, context)).toEqual({
      preset: "deep",
      volume: 0.9,
      audioContext: context,
    });
  });

  it("keeps the hook's own audio context over the shared one", () => {
    const own = {} as AudioContext;
    expect(mergeOptions(undefined, { audioContext: own }, {} as AudioContext).audioContext).toBe(own);
  });
});
