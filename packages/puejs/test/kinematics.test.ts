import { describe, expect, it } from "vitest";
import { createKinematics, updateKinematics } from "../src/kinematics";

describe("kinematics", () => {
  it("starts at rest", () => {
    expect(createKinematics(120, 0)).toEqual({ position: 120, time: 0, velocity: 0 });
  });

  it("converges to a constant scroll speed in px/s", () => {
    let state = createKinematics(0, 0);
    for (let frame = 1; frame <= 30; frame++) state = updateKinematics(state, frame * 16, frame * 16);
    expect(state.velocity).toBeGreaterThan(990);
    expect(state.velocity).toBeLessThan(1010);
  });

  it("smooths a single jump", () => {
    const state = updateKinematics(createKinematics(0, 0), 16, 16);
    expect(state.velocity).toBeCloseTo(1000 * (1 - Math.exp(-16 / 50)), 5);
  });

  it("is signed by direction", () => {
    const state = updateKinematics(createKinematics(500, 0), 484, 16);
    expect(state.velocity).toBeLessThan(0);
  });

  it("ignores non-increasing timestamps", () => {
    const start = createKinematics(0, 100);
    expect(updateKinematics(start, 50, 100)).toBe(start);
    expect(updateKinematics(start, 50, 90)).toBe(start);
  });
});
