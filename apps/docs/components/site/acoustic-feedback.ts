import { createEmitter, type EmissionEvent, type Emitter } from "@puejs/core";
import { cathedral, fortissimo, pesante, sforzando, soprano, staccato, sustained } from "@puejs/core/odors";

const STORAGE_KEY = "puejs:acoustic-feedback";

let emitter: Emitter | null = null;
let enabled = false;
let restored = false;
const listeners = new Set<() => void>();
const emissionListeners = new Set<(emission: EmissionEvent) => void>();

function getEmitter(): Emitter {
  if (!emitter) {
    // The toggle is an explicit opt-in, so reduced motion does not silence it.
    emitter = createEmitter(window, {
      preset: "organic",
      odors: [staccato, sustained, soprano, pesante, sforzando, fortissimo, cathedral],
      // Long enough for fortissimo (2.5 s); shorter odors end naturally.
      duration: 2600,
      // One emission per half viewport: each scroll gesture is heard on its own.
      throttle: "distance",
      respectReducedMotion: false,
    });
    emitter.on("emit", (emission) => {
      for (const listener of emissionListeners) listener(emission);
    });
  }
  return emitter;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSnapshot = (): boolean => enabled;

export const getServerSnapshot = (): boolean => false;

/** Turns acoustic feedback on or off. Must be called from a user gesture to unlock audio immediately. */
export function setEnabled(next: boolean): void {
  if (next === enabled) return;
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage unavailable: the preference is not persisted.
  }
  if (next) void getEmitter().start();
  else emitter?.stop();
  for (const listener of listeners) listener();
}

/** Restores the persisted preference. Audio stays suspended until the next gesture (autoUnlock). */
export function restore(): void {
  if (restored) return;
  restored = true;
  try {
    if (localStorage.getItem(STORAGE_KEY) === "on") setEnabled(true);
  } catch {
    // Storage unavailable: keep acoustic feedback off.
  }
}

export function onEmission(listener: (emission: EmissionEvent) => void): () => void {
  emissionListeners.add(listener);
  return () => {
    emissionListeners.delete(listener);
  };
}
