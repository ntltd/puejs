import { describe, expect, it } from "vitest";
import { createEmitterWithEnvironment } from "../src/emitter";
import { PueError } from "../src/errors";
import { defineOdor } from "../src/odor";
import type { EmissionEvent, EmitterOptions } from "../src/types";
import {
  FakeAudioContext,
  type FakeAudioContextOptions,
  FakeEnvironment,
  type FakeFilter,
  type FakeGain,
  FakeScrollTarget,
  dataUri,
  scrollAtSpeed,
} from "./fakes";

const quiet = defineOdor({ name: "quiet", src: dataUri("GOOD quiet"), tonnage: [0, 0.6] });
const loud = defineOdor({ name: "loud", src: dataUri("GOOD loud"), tonnage: [0.4, 1] });
const broken = defineOdor({ name: "broken", src: dataUri("BAD") });

function setup(options: EmitterOptions = {}, contextOptions: FakeAudioContextOptions = {}) {
  const env = new FakeEnvironment();
  env.contextOptions = contextOptions;
  const target = new FakeScrollTarget();
  const emitter = createEmitterWithEnvironment(target.asTarget(), { odors: [quiet, loud], ...options }, env);
  const emissions: EmissionEvent[] = [];
  emitter.on("emit", (emission) => emissions.push(emission));
  const context = (): FakeAudioContext => env.contexts[0];
  return { env, target, emitter, emissions, context };
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const expectCode = (fn: () => unknown, code: PueError["code"]): void => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(PueError);
    expect((error as PueError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
};

describe("lifecycle", () => {
  it("stays idle and allocates nothing before start()", () => {
    const { env, target, emitter } = setup();
    expect(emitter.state).toBe("idle");
    expect(emitter.context).toBeNull();
    expect(env.contexts).toHaveLength(0);
    expect(target.listenerCount).toBe(0);
  });

  it("starts running, decodes odors and observes scroll", async () => {
    const { emitter, target, context } = setup();
    await emitter.start();
    expect(emitter.state).toBe("running");
    expect(context().decodeCalls).toBe(2);
    expect(target.listenerCount).toBe(1);
  });

  it("reports state changes", async () => {
    const { emitter } = setup();
    const changes: string[] = [];
    emitter.on("statechange", ({ previous, current }) => changes.push(`${previous}->${current}`));
    await emitter.start();
    emitter.stop();
    expect(changes).toEqual(["idle->running", "running->idle"]);
  });

  it("is suspended when audio is blocked, then unlocks on the next gesture", async () => {
    const { env, emitter, context } = setup({}, { state: "suspended", allowResume: false });
    const unlocks: unknown[] = [];
    emitter.on("unlock", (event) => unlocks.push(event.context));
    await emitter.start();
    expect(emitter.state).toBe("suspended");
    expect(env.gestureListenerCount).toBe(1);

    context().allowResume = true;
    env.gesture();
    expect(emitter.state).toBe("running");
    expect(unlocks).toEqual([context()]);
    expect(env.gestureListenerCount).toBe(0);
  });

  it("does not hang when resume() never settles", async () => {
    const { emitter } = setup({}, { state: "suspended", allowResume: false, hangResume: true });
    await emitter.start();
    expect(emitter.state).toBe("suspended");
  });

  it("resolves running when the device starts after decoding", async () => {
    const { emitter } = setup({}, { state: "suspended", asyncResume: true });
    const changes: string[] = [];
    const unlocks: unknown[] = [];
    emitter.on("statechange", ({ previous, current }) => changes.push(`${previous}->${current}`));
    emitter.on("unlock", (event) => unlocks.push(event));
    await emitter.start();
    expect(emitter.state).toBe("running");
    expect(changes).toEqual(["idle->running"]);
    expect(unlocks).toHaveLength(0);
  });

  it("resumes audio when start() is called again while suspended", async () => {
    const { emitter, context } = setup({ autoUnlock: false }, { state: "suspended", allowResume: false });
    await emitter.start();
    expect(emitter.state).toBe("suspended");
    context().allowResume = true;
    await emitter.start();
    expect(emitter.state).toBe("running");
  });

  it("does not arm the gesture listener without autoUnlock", async () => {
    const { env, emitter } = setup({ autoUnlock: false }, { state: "suspended", allowResume: false });
    await emitter.start();
    expect(emitter.state).toBe("suspended");
    expect(env.gestureListenerCount).toBe(0);
  });

  it("attaches a single listener when start() is called twice", async () => {
    const { emitter, target } = setup();
    await Promise.all([emitter.start(), emitter.start()]);
    expect(target.listenerCount).toBe(1);
  });

  it("stays idle when stop() is called while start() is decoding", async () => {
    const { emitter, target } = setup();
    const pending = emitter.start();
    emitter.stop();
    await pending;
    expect(emitter.state).toBe("idle");
    expect(target.listenerCount).toBe(0);
  });

  it("can be restarted after stop()", async () => {
    const { env, emitter, target, emissions } = setup();
    await emitter.start();
    emitter.stop();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions.length).toBeGreaterThan(0);
  });
});

describe("emissions", () => {
  it("plays a voice when scrolling above the threshold", async () => {
    const { env, target, emitter, emissions, context } = setup();
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);

    expect(emissions.length).toBeGreaterThan(0);
    expect(context().sources).toHaveLength(emissions.length);
    const [first] = emissions;
    const source = context().sources[0];
    const gain = (source.connections[0] as FakeFilter).connections[0] as FakeGain;
    expect(first.direction).toBe(1);
    expect(first.velocity).toBeGreaterThan(80);
    expect(first.pitch).toBeGreaterThanOrEqual(0.9);
    expect(first.pitch).toBeLessThanOrEqual(1.1);
    expect(source.playbackRate.value).toBe(first.pitch);
    expect(gain.gain.events[0].value).toBeCloseTo(0.8 * (0.25 + 0.75 * first.tonnage), 5);
    expect(first.timestamp).toBeCloseTo(0.005, 5);
  });

  it("reports the scroll direction", async () => {
    const { env, target, emitter, emissions } = setup();
    target.scrollY = 5000;
    await emitter.start();
    scrollAtSpeed(env, target, -2000, 10);
    expect(emissions.length).toBeGreaterThan(0);
    expect(emissions.every((emission) => emission.direction === -1)).toBe(true);
  });

  it("ignores scrolling below the threshold", async () => {
    const { env, target, emitter, emissions } = setup();
    await emitter.start();
    scrollAtSpeed(env, target, 50, 30);
    expect(emissions).toHaveLength(0);
  });

  it("does not emit on frames without movement", async () => {
    const { env, target, emitter, emissions } = setup({ threshold: 0, throttle: 0 });
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 5);
    const count = emissions.length;
    for (let frame = 0; frame < 20; frame++) env.flushFrame();
    expect(emissions).toHaveLength(count);
    expect(env.pendingFrames).toBe(0);
  });

  it("applies a fixed throttle", async () => {
    const { env, target, emitter, emissions } = setup({ throttle: 1000 });
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 30);
    expect(emissions).toHaveLength(1);
  });

  it("caps polyphony at six voices by stopping the oldest", async () => {
    const { env, target, emitter, context } = setup({ throttle: 0 });
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 12);
    const sources = context().sources;
    expect(sources.length).toBeGreaterThan(6);
    const stolen = sources.filter((source) => source.stopCalls.includes("now"));
    expect(stolen).toEqual(sources.slice(0, sources.length - 6));
  });

  it("selects odors by tonnage", async () => {
    const slow = setup();
    await slow.emitter.start();
    scrollAtSpeed(slow.env, slow.target, 150, 40);
    expect(slow.emissions.length).toBeGreaterThan(0);
    expect(slow.emissions.every((emission) => emission.odor === "quiet")).toBe(true);

    const fast = setup();
    await fast.emitter.start();
    scrollAtSpeed(fast.env, fast.target, 4000, 40);
    expect(fast.emissions.at(-1)?.odor).toBe("loud");
  });

  it("is deterministic", async () => {
    const first = setup();
    const second = setup();
    await first.emitter.start();
    await second.emitter.start();
    scrollAtSpeed(first.env, first.target, 1800, 40);
    scrollAtSpeed(second.env, second.target, 1800, 40);
    expect(first.emissions.length).toBeGreaterThan(0);
    expect(first.emissions).toEqual(second.emissions);
  });

  it("stays silent when the user prefers reduced motion", async () => {
    const { env, target, emitter, emissions } = setup();
    env.reduced = true;
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
  });

  it("follows reduced motion changes live", async () => {
    const { env, target, emitter, emissions } = setup();
    await emitter.start();
    env.setReducedMotion(true);
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
  });

  it("can ignore reduced motion", async () => {
    const { env, target, emitter, emissions } = setup({ respectReducedMotion: false });
    env.reduced = true;
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions.length).toBeGreaterThan(0);
  });

  it("stays silent while the document is hidden", async () => {
    const { env, target, emitter, emissions } = setup();
    await emitter.start();
    env.hidden = true;
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
  });

  it("emits manually", async () => {
    const { emitter, emissions } = setup();
    emitter.emit({ tonnage: 1 });
    expect(emissions).toHaveLength(0);
    await emitter.start();
    emitter.emit({ tonnage: 1 });
    expect(emissions).toEqual([expect.objectContaining({ tonnage: 1, velocity: 0, odor: "loud" })]);
    emitter.emit({ odor: quiet });
    expect(emissions.at(-1)?.odor).toBe("quiet");
    expectCode(() => emitter.emit({ tonnage: 2 }), "E_INVALID_OPTION");
  });
});

describe("updates and errors", () => {
  it("applies updated options to the next emission", async () => {
    const { emitter, context } = setup();
    await emitter.start();
    emitter.update({ volume: 0.5 });
    emitter.emit({ tonnage: 1 });
    const gain = (context().sources[0].connections[0] as FakeFilter).connections[0] as FakeGain;
    expect(gain.gain.events[0].value).toBeCloseTo(0.5, 5);
  });

  it("keeps the previous options when an update is invalid", () => {
    const { emitter } = setup({ volume: 0.3 });
    expectCode(() => emitter.update({ volume: 4 }), "E_INVALID_OPTION");
    expect(emitter.options.volume).toBe(0.3);
  });

  it("refuses to change the audio context after start()", async () => {
    const { emitter } = setup();
    await emitter.start();
    expectCode(() => emitter.update({ audioContext: new FakeAudioContext().asAudioContext() }), "E_INVALID_OPTION");
  });

  it("reports undecodable odors and keeps running with the others", async () => {
    const { env, target, emitter, emissions } = setup({ odors: [broken, quiet] });
    const errors: PueError[] = [];
    emitter.on("error", (error) => errors.push(error));
    await emitter.start();
    expect(errors.map((error) => error.code)).toEqual(["E_DECODE"]);
    expect(emitter.state).toBe("running");
    scrollAtSpeed(env, target, 300, 20);
    expect(emissions.length).toBeGreaterThan(0);
    expect(emissions.every((emission) => emission.odor === "quiet")).toBe(true);
  });

  it("isolates exceptions thrown by handlers", async () => {
    const { env, emitter, emissions } = setup();
    emitter.on("emit", () => {
      throw new Error("handler failure");
    });
    const after: EmissionEvent[] = [];
    emitter.on("emit", (emission) => after.push(emission));
    await emitter.start();
    emitter.emit();
    expect(env.errors).toHaveLength(1);
    expect(emissions).toHaveLength(1);
    expect(after).toHaveLength(1);
  });
});

describe("destroy", () => {
  it("releases everything and rejects further calls", async () => {
    const { emitter, target, context } = setup();
    await emitter.start();
    emitter.destroy();
    expect(emitter.state).toBe("destroyed");
    expect(target.listenerCount).toBe(0);
    expect(context().state).toBe("closed");
    expectCode(() => emitter.start(), "E_DESTROYED");
    expectCode(() => emitter.stop(), "E_DESTROYED");
    expectCode(() => emitter.update({ volume: 0.1 }), "E_DESTROYED");
    expectCode(() => emitter.emit(), "E_DESTROYED");
    expectCode(() => emitter.on("emit", () => {}), "E_DESTROYED");
  });

  it("is idempotent and keeps off() safe", () => {
    const { emitter } = setup();
    const handler = (): void => {};
    emitter.on("emit", handler);
    emitter.destroy();
    expect(() => emitter.destroy()).not.toThrow();
    expect(() => emitter.off("emit", handler)).not.toThrow();
  });

  it("leaves a shared audio context open", async () => {
    const shared = new FakeAudioContext();
    const { emitter } = setup({ audioContext: shared.asAudioContext() });
    await emitter.start();
    emitter.destroy();
    expect(shared.state).toBe("running");
  });

  it("stops in-flight voices", async () => {
    const { emitter, context } = setup();
    await emitter.start();
    emitter.emit();
    emitter.destroy();
    expect(context().sources[0].stopCalls).toContain("now");
  });

  it("ignores decodes that finish after destroy()", async () => {
    const { emitter } = setup();
    const pending = emitter.start();
    emitter.destroy();
    await pending;
    await tick();
    expect(emitter.state).toBe("destroyed");
  });
});
