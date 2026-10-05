import { describe, expect, it } from "vitest";
import { cathedral, fortissimo, pesante, sforzando, soprano, staccato, sustained } from "../src/odors";
import { presets } from "../src/presets";

describe("odors", () => {
  it("ship as inline mp3 data with their tonnage ranges", () => {
    expect(staccato.name).toBe("staccato");
    expect(staccato.tonnage).toEqual([0, 0.6]);
    expect(sustained.name).toBe("sustained");
    expect(sustained.tonnage).toEqual([0.4, 1]);
    for (const odor of [staccato, sustained]) expect(odor.src.startsWith("data:audio/mpeg;base64,")).toBe(true);
  });

  it("ship the expressive odors as opt-in modules", () => {
    expect(soprano).toMatchObject({ name: "soprano", tonnage: [0.3, 0.8] });
    expect(pesante).toMatchObject({ name: "pesante", tonnage: [0.5, 1] });
    expect(fortissimo).toMatchObject({ name: "fortissimo", tonnage: [0.85, 1] });
    expect(sforzando).toMatchObject({ name: "sforzando", tonnage: [0.7, 1] });
    expect(cathedral).toMatchObject({ name: "cathedral", tonnage: [0.9, 1] });
    for (const odor of [soprano, pesante, fortissimo, sforzando, cathedral]) {
      expect(odor.src.startsWith("data:audio/mpeg;base64,")).toBe(true);
    }
  });

  it("keep the expressive odors out of the presets", () => {
    const presetOdors = Object.values(presets).flatMap((profile) => profile.odors);
    for (const odor of [soprano, pesante, fortissimo, sforzando, cathedral]) expect(presetOdors).not.toContain(odor);
  });
});

describe("presets", () => {
  it("are frozen", () => {
    expect(Object.isFrozen(presets)).toBe(true);
    for (const profile of Object.values(presets)) {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(profile.odors)).toBe(true);
    }
  });

  it("match the documented profiles", () => {
    expect(presets.organic).toMatchObject({
      pitch: { min: 0.9, max: 1.1 },
      resonance: 0.4,
      duration: 320,
      volume: 0.8,
    });
    expect(presets.crisp).toMatchObject({ pitch: { min: 1.1, max: 1.35 }, resonance: 0.2, duration: 180, volume: 0.8 });
    expect(presets.deep).toMatchObject({ pitch: { min: 0.6, max: 0.8 }, resonance: 0.7, duration: 620, volume: 0.8 });
    expect(presets.discreet).toMatchObject({
      pitch: { min: 0.95, max: 1.05 },
      resonance: 0.25,
      duration: 220,
      volume: 0.4,
    });
    expect(presets.organic.odors).toEqual([staccato, sustained]);
    expect(presets.crisp.odors).toEqual([staccato]);
    expect(presets.deep.odors).toEqual([sustained]);
    expect(presets.discreet.odors).toEqual([staccato]);
  });
});
