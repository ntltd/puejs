import { RESUME_GRACE, createEmitterWithEnvironment, settleWithin, type ScrollTarget } from "./emitter";
import { browserEnvironment, isSupported, trackedContexts } from "./environment";
import { createInertEmitter } from "./inert";
import type { Emitter, EmitterOptions } from "./types";

/** Binds an acoustic profile to a scroll container. Inert on the server and without Web Audio. */
export function createEmitter(target: ScrollTarget, options?: EmitterOptions): Emitter {
  return isSupported()
    ? createEmitterWithEnvironment(target, options, browserEnvironment())
    : createInertEmitter(options);
}

/** Resumes the given context, or every context created by Pue JS, from within a user gesture. */
export async function unlock(context?: AudioContext): Promise<boolean> {
  const contexts = context ? [context] : [...trackedContexts];
  // Without user activation, some browsers keep resume() pending: never wait longer than the grace period.
  await Promise.all(contexts.map((item) => settleWithin(item.resume(), RESUME_GRACE)));
  return contexts.length > 0 && contexts.every((item) => item.state === "running");
}

export { isSupported } from "./environment";
export { PueError } from "./errors";
export type { PueErrorCode } from "./errors";
export { defineOdor } from "./odor";
export type { OdorDefinition } from "./odor";
export { presets } from "./presets";
export { defineTonnageCurve } from "./tonnage";
export type { ScrollTarget } from "./emitter";
export type {
  AcousticProfile,
  EmissionEvent,
  EmissionInput,
  Emitter,
  EmitterEventHandler,
  EmitterEvents,
  EmitterOptions,
  EmitterState,
  Odor,
  PitchRange,
  PresetName,
  ResolvedOptions,
  ThrottleStrategy,
  TonnageCurve,
  TonnageCurveName,
} from "./types";
