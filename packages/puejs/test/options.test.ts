import { describe, expect, it } from "vitest";
import { PueError } from "../src/errors";
import { defineOdor } from "../src/odor";
import { staccato, sustained } from "../src/odors";
import { resolveOptions } from "../src/options";

const custom = defineOdor({ name: "custom", src: "/custom.mp3" });

describe("resolveOptions", () => {
  it("defaults to the organic preset", () => {
    expect(resolveOptions()).toEqual({
      odors: [staccato, sustained],
      pitch: { min: 0.9, max: 1.1 },
      resonance: 0.4,
      duration: 320,
      volume: 0.8,
      tonnage: "logarithmic",
      threshold: 80,
      throttle: "velocity",
      respectReducedMotion: true,
      autoUnlock: true,
      audioContext: undefined,
    });
  });

  it("resolves presets by name or profile", () => {
    expect(resolveOptions({ preset: "deep" }).pitch).toEqual({ min: 0.6, max: 0.8 });
    expect(
      resolveOptions({
        preset: { odors: [custom], pitch: 1, resonance: 0, duration: 100, volume: 1, tonnage: "linear" },
      }).odors,
    ).toEqual([custom]);
  });

  it("merges explicit options over the preset", () => {
    const resolved = resolveOptions({ preset: "crisp", volume: 0.5, odors: [custom], pitch: 1.2 });
    expect(resolved.volume).toBe(0.5);
    expect(resolved.odors).toEqual([custom]);
    expect(resolved.pitch).toEqual({ min: 1.2, max: 1.2 });
    expect(resolved.duration).toBe(180);
  });

  it("returns frozen options", () => {
    const resolved = resolveOptions();
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.odors)).toBe(true);
    expect(Object.isFrozen(resolved.pitch)).toBe(true);
  });

  it.each([
    ["preset", { preset: "loud" }],
    ["pitch zero", { pitch: 0 }],
    ["pitch inverted", { pitch: { min: 2, max: 1 } }],
    ["resonance", { resonance: 2 }],
    ["volume", { volume: -1 }],
    ["duration", { duration: 0 }],
    ["threshold", { threshold: 3000 }],
    ["throttle", { throttle: -5 }],
    ["tonnage", { tonnage: "cubic" }],
    ["empty odors", { odors: [] }],
    ["invalid odor", { odors: [{}] }],
    ["autoUnlock", { autoUnlock: "yes" }],
    ["audioContext", { audioContext: 42 }],
  ])("rejects an invalid %s", (_label, options) => {
    expect(() => resolveOptions(options as never)).toThrow(PueError);
    try {
      resolveOptions(options as never);
    } catch (error) {
      expect((error as PueError).code).toBe("E_INVALID_OPTION");
    }
  });

  it("rejects non-object options", () => {
    expect(() => resolveOptions("organic" as never)).toThrow(PueError);
  });
});
