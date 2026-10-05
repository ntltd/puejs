import { presets, type EmitterOptions, type Odor, type PresetName, type TonnageCurveName } from "puejs";
import { cathedral, fortissimo, pesante, sforzando, soprano, staccato, sustained } from "puejs/odors";

export const ODORS = {
  staccato,
  sustained,
  soprano,
  pesante,
  sforzando,
  fortissimo,
  cathedral,
} satisfies Record<string, Odor>;

export type OdorName = keyof typeof ODORS;
export type ThrottleMode = "velocity" | "distance" | "interval";

export const ODOR_NAMES = Object.keys(ODORS) as OdorName[];

/** Length of each encoded sample, in milliseconds. */
export const ODOR_DURATIONS: Record<OdorName, number> = {
  staccato: 310,
  sustained: 220,
  soprano: 370,
  pesante: 940,
  sforzando: 1010,
  fortissimo: 2520,
  cathedral: 2160,
};

/** Raises the duration so that the given odor is never cut short. */
export const withDurationFor = (settings: Settings, name: OdorName): Settings =>
  ODOR_DURATIONS[name] > settings.duration ? { ...settings, duration: ODOR_DURATIONS[name] } : settings;
export const PRESET_NAMES = Object.keys(presets) as PresetName[];
export const TONNAGE_CURVES: TonnageCurveName[] = ["logarithmic", "linear", "exponential"];

export interface Settings {
  preset: PresetName;
  odors: OdorName[];
  pitchMin: number;
  pitchMax: number;
  resonance: number;
  duration: number;
  volume: number;
  threshold: number;
  throttle: ThrottleMode;
  interval: number;
  tonnage: TonnageCurveName;
}

const DEFAULT_THRESHOLD = 80;
const DEFAULT_INTERVAL = 300;

/** Loads the values of a preset into the controls. */
export function settingsFromPreset(preset: PresetName): Settings {
  const profile = presets[preset];
  const pitch = typeof profile.pitch === "number" ? { min: profile.pitch, max: profile.pitch } : profile.pitch;
  return {
    preset,
    odors: profile.odors.map((odor) => odor.name as OdorName),
    pitchMin: pitch.min,
    pitchMax: pitch.max,
    resonance: profile.resonance,
    duration: profile.duration,
    volume: profile.volume,
    threshold: DEFAULT_THRESHOLD,
    throttle: "velocity",
    interval: DEFAULT_INTERVAL,
    tonnage: typeof profile.tonnage === "string" ? profile.tonnage : "logarithmic",
  };
}

const throttleValue = (settings: Settings): EmitterOptions["throttle"] =>
  settings.throttle === "interval" ? settings.interval : settings.throttle;

export function toOptions(settings: Settings): EmitterOptions {
  return {
    preset: settings.preset,
    odors: settings.odors.map((name) => ODORS[name]),
    pitch: { min: settings.pitchMin, max: settings.pitchMax },
    resonance: settings.resonance,
    duration: settings.duration,
    volume: settings.volume,
    threshold: settings.threshold,
    throttle: throttleValue(settings),
    tonnage: settings.tonnage,
    // The playground is an explicit opt-in.
    respectReducedMotion: false,
  };
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** The createEmitter() call matching the settings, listing only what differs from the preset. */
export function generateCode(settings: Settings): string {
  const base = settingsFromPreset(settings.preset);
  const lines: string[] = [`  preset: "${settings.preset}",`];
  const customOdors = settings.odors.join() !== base.odors.join();

  if (customOdors) lines.push(`  odors: [${settings.odors.join(", ")}],`);
  if (settings.pitchMin !== base.pitchMin || settings.pitchMax !== base.pitchMax) {
    lines.push(`  pitch: { min: ${round(settings.pitchMin)}, max: ${round(settings.pitchMax)} },`);
  }
  if (settings.resonance !== base.resonance) lines.push(`  resonance: ${round(settings.resonance)},`);
  if (settings.duration !== base.duration) lines.push(`  duration: ${settings.duration},`);
  if (settings.volume !== base.volume) lines.push(`  volume: ${round(settings.volume)},`);
  if (settings.threshold !== base.threshold) lines.push(`  threshold: ${settings.threshold},`);
  if (settings.throttle !== base.throttle) {
    const value = throttleValue(settings);
    lines.push(`  throttle: ${typeof value === "number" ? value : `"${value}"`},`);
  }
  if (settings.tonnage !== base.tonnage) lines.push(`  tonnage: "${settings.tonnage}",`);

  return [
    `import { createEmitter } from "puejs";`,
    ...(customOdors ? [`import { ${[...settings.odors].sort().join(", ")} } from "puejs/odors";`] : []),
    ``,
    `const emitter = createEmitter(element, {`,
    ...lines,
    `});`,
    ``,
    `// Audio requires a user gesture.`,
    `button.addEventListener("click", () => emitter.start());`,
  ].join("\n");
}
