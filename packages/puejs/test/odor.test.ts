import { describe, expect, it } from "vitest";
import { PueError } from "../src/errors";
import { defineOdor, isOdor } from "../src/odor";

describe("defineOdor", () => {
  it("returns a frozen odor with a full tonnage range by default", () => {
    const odor = defineOdor({ name: "custom", src: "/sounds/custom.mp3" });
    expect(odor).toEqual({ name: "custom", src: "/sounds/custom.mp3", tonnage: [0, 1] });
    expect(Object.isFrozen(odor)).toBe(true);
    expect(Object.isFrozen(odor.tonnage)).toBe(true);
  });

  it.each([
    [{ name: "", src: "/a.mp3" }],
    [{ name: "a", src: "" }],
    [{ name: "a", src: "/a.mp3", tonnage: [0.8, 0.2] }],
    [{ name: "a", src: "/a.mp3", tonnage: [-0.1, 1] }],
    [{ name: "a", src: "/a.mp3", tonnage: [0, 1.5] }],
  ])("rejects %j", (definition) => {
    expect(() => defineOdor(definition as never)).toThrow(PueError);
  });
});

describe("isOdor", () => {
  it("recognizes odors", () => {
    expect(isOdor(defineOdor({ name: "a", src: "/a.mp3" }))).toBe(true);
    expect(isOdor({ name: "a" })).toBe(false);
    expect(isOdor(null)).toBe(false);
  });
});
