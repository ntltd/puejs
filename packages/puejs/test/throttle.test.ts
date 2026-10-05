import { describe, expect, it } from "vitest";
import { canEmit } from "../src/throttle";

const frame = { time: 0, position: 0, tonnage: 0, viewportHeight: 800 };

describe("canEmit", () => {
  it("always allows the first emission", () => {
    expect(canEmit("velocity", { lastTime: Number.NEGATIVE_INFINITY, lastPosition: 0 }, frame)).toBe(true);
  });

  it("shortens the interval with tonnage for the velocity strategy", () => {
    const state = { lastTime: 0, lastPosition: 0 };
    expect(canEmit("velocity", state, { ...frame, time: 259, tonnage: 0 })).toBe(false);
    expect(canEmit("velocity", state, { ...frame, time: 260, tonnage: 0 })).toBe(true);
    expect(canEmit("velocity", state, { ...frame, time: 59, tonnage: 1 })).toBe(false);
    expect(canEmit("velocity", state, { ...frame, time: 60, tonnage: 1 })).toBe(true);
  });

  it("uses a fixed interval for numbers", () => {
    const state = { lastTime: 1000, lastPosition: 0 };
    expect(canEmit(100, state, { ...frame, time: 1099 })).toBe(false);
    expect(canEmit(100, state, { ...frame, time: 1100 })).toBe(true);
  });

  it("emits every half viewport for the distance strategy", () => {
    const state = { lastTime: 0, lastPosition: 1000 };
    expect(canEmit("distance", state, { ...frame, position: 1399 })).toBe(false);
    expect(canEmit("distance", state, { ...frame, position: 1400 })).toBe(true);
    expect(canEmit("distance", state, { ...frame, position: 600 })).toBe(true);
  });
});
