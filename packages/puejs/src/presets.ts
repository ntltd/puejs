import { staccato } from "./odors/staccato";
import { sustained } from "./odors/sustained";
import type { AcousticProfile, PresetName } from "./types";

const profile = (definition: AcousticProfile): AcousticProfile =>
  Object.freeze({
    ...definition,
    odors: Object.freeze([...definition.odors]),
    pitch: typeof definition.pitch === "number" ? definition.pitch : Object.freeze({ ...definition.pitch }),
  });

export const presets: Readonly<Record<PresetName, AcousticProfile>> = Object.freeze({
  organic: profile({
    odors: [staccato, sustained],
    pitch: { min: 0.9, max: 1.1 },
    resonance: 0.4,
    duration: 320,
    volume: 0.8,
    tonnage: "logarithmic",
  }),
  crisp: profile({
    odors: [staccato],
    pitch: { min: 1.1, max: 1.35 },
    resonance: 0.2,
    duration: 180,
    volume: 0.8,
    tonnage: "logarithmic",
  }),
  deep: profile({
    odors: [sustained],
    pitch: { min: 0.6, max: 0.8 },
    resonance: 0.7,
    duration: 620,
    volume: 0.8,
    tonnage: "logarithmic",
  }),
  discreet: profile({
    odors: [staccato],
    pitch: { min: 0.95, max: 1.05 },
    resonance: 0.25,
    duration: 220,
    volume: 0.4,
    tonnage: "logarithmic",
  }),
});
