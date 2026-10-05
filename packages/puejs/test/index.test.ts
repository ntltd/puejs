import { afterEach, describe, expect, it, vi } from "vitest";
import { PueError, createEmitter, isSupported, presets, unlock } from "../src/index";
import { FakeAudioContext, FakeScrollTarget } from "./fakes";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isSupported", () => {
  it("is false on the server", () => {
    expect(isSupported()).toBe(false);
  });

  it("detects the Web Audio API", () => {
    vi.stubGlobal("window", { AudioContext: class {} });
    expect(isSupported()).toBe(true);
  });
});

describe("createEmitter without Web Audio", () => {
  it("returns an inert emitter with the same API", async () => {
    const emitter = createEmitter(new FakeScrollTarget().asTarget(), { preset: "crisp" });
    expect(emitter.state).toBe("idle");
    expect(emitter.context).toBeNull();
    expect(emitter.options.odors).toEqual(presets.crisp.odors);
    await expect(emitter.start()).resolves.toBeUndefined();
    expect(emitter.state).toBe("idle");
    emitter.update({ volume: 0.2 });
    expect(emitter.options.volume).toBe(0.2);
    emitter.emit();
    const off = emitter.on("emit", () => {});
    off();
    emitter.stop();
    emitter.destroy();
    emitter.destroy();
    expect(emitter.state).toBe("destroyed");
    expect(() => emitter.start()).toThrow(PueError);
  });

  it("still validates options", () => {
    expect(() => createEmitter(new FakeScrollTarget().asTarget(), { volume: 3 })).toThrow(PueError);
  });
});

describe("unlock", () => {
  it("resumes the given context", async () => {
    const context = new FakeAudioContext({ state: "suspended" });
    await expect(unlock(context.asAudioContext())).resolves.toBe(true);
    expect(context.state).toBe("running");
  });

  it("reports blocked contexts", async () => {
    const context = new FakeAudioContext({ state: "suspended", allowResume: false });
    await expect(unlock(context.asAudioContext())).resolves.toBe(false);
  });

  it("does not hang when resume() never settles", async () => {
    const context = new FakeAudioContext({ state: "suspended", allowResume: false, hangResume: true });
    await expect(unlock(context.asAudioContext())).resolves.toBe(false);
  });

  it("is false when there is nothing to unlock", async () => {
    await expect(unlock()).resolves.toBe(false);
  });
});
