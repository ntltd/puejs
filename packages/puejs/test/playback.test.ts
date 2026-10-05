import { describe, expect, it } from "vitest";
import { defineOdor } from "../src/odor";
import { decodeDataUri, loadOdor, playVoice } from "../src/playback";
import { FakeAudioContext, type FakeFilter, type FakeGain, dataUri } from "./fakes";

const noFetch = (): Promise<ArrayBuffer> => Promise.reject(new Error("unexpected fetch"));

describe("decodeDataUri", () => {
  it("decodes base64 payloads", () => {
    expect(new TextDecoder().decode(decodeDataUri(dataUri("GOOD")))).toBe("GOOD");
  });

  it("rejects other URIs", () => {
    expect(() => decodeDataUri("https://example.com/a.mp3")).toThrow(TypeError);
    expect(() => decodeDataUri("data:audio/mpeg,raw")).toThrow(TypeError);
  });
});

describe("loadOdor", () => {
  it("decodes inline odors without fetching", async () => {
    const context = new FakeAudioContext();
    const buffer = await loadOdor(context.asAudioContext(), defineOdor({ name: "a", src: dataUri("GOOD a") }), noFetch);
    expect(buffer).toEqual({ duration: 0.36, label: "GOOD a" });
  });

  it("fetches URL odors", async () => {
    const context = new FakeAudioContext();
    const fetched: string[] = [];
    const fetchArrayBuffer = (url: string): Promise<ArrayBuffer> => {
      fetched.push(url);
      return Promise.resolve(new TextEncoder().encode("GOOD remote").buffer as ArrayBuffer);
    };
    const buffer = await loadOdor(context.asAudioContext(), defineOdor({ name: "r", src: "/r.mp3" }), fetchArrayBuffer);
    expect(fetched).toEqual(["/r.mp3"]);
    expect(buffer).toMatchObject({ label: "GOOD remote" });
  });

  it("caches decoded buffers per context", async () => {
    const odor = defineOdor({ name: "a", src: dataUri("GOOD cached") });
    const first = new FakeAudioContext();
    const second = new FakeAudioContext();
    await loadOdor(first.asAudioContext(), odor, noFetch);
    await loadOdor(first.asAudioContext(), odor, noFetch);
    await loadOdor(second.asAudioContext(), odor, noFetch);
    expect(first.decodeCalls).toBe(1);
    expect(second.decodeCalls).toBe(1);
  });

  it("allows retrying after a failure", async () => {
    const context = new FakeAudioContext();
    const odor = defineOdor({ name: "bad", src: dataUri("BAD") });
    await expect(loadOdor(context.asAudioContext(), odor, noFetch)).rejects.toThrow("Unable to decode");
    await expect(loadOdor(context.asAudioContext(), odor, noFetch)).rejects.toThrow("Unable to decode");
    expect(context.decodeCalls).toBe(2);
  });
});

describe("playVoice", () => {
  it("builds the source → filter → gain → destination graph", () => {
    const context = new FakeAudioContext();
    const buffer = { duration: 0.36 } as unknown as AudioBuffer;
    let ended = 0;
    playVoice(
      context.asAudioContext(),
      buffer,
      { pitch: 1.2, resonance: 0.5, duration: 320, gain: 0.6, when: 10 },
      () => ended++,
    );

    const [source] = context.sources;
    const filter = source.connections[0] as FakeFilter;
    const gain = filter.connections[0] as FakeGain;
    expect(source.buffer).toBe(buffer);
    expect(source.playbackRate.value).toBe(1.2);
    expect(filter.type).toBe("peaking");
    expect(filter.frequency.value).toBe(180);
    expect(filter.gain.value).toBe(6);
    expect(gain.connections[0]).toBe(context.destination);
    expect(gain.gain.events).toEqual([
      { type: "set", value: 0.6, time: 10 },
      { type: "set", value: 0.6, time: expect.closeTo(10.26, 5) },
      { type: "ramp", value: 0, time: expect.closeTo(10.32, 5) },
    ]);
    expect(source.startTime).toBe(10);
    expect(source.stopCalls).toEqual([expect.closeTo(10.32, 5)]);

    source.end();
    expect(ended).toBe(1);
    expect(source.disconnected && filter.disconnected && gain.disconnected).toBe(true);
  });

  it("starts the fade immediately for durations shorter than the fade", () => {
    const context = new FakeAudioContext();
    playVoice(
      context.asAudioContext(),
      {} as AudioBuffer,
      { pitch: 1, resonance: 0, duration: 30, gain: 1, when: 0 },
      () => {},
    );
    const gain = (context.sources[0].connections[0] as FakeFilter).connections[0] as FakeGain;
    expect(gain.gain.events[1]).toEqual({ type: "set", value: 1, time: 0 });
  });
});
