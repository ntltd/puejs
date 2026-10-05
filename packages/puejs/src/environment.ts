/** Every browser API the emitter touches, injectable for tests. */
export interface Environment {
  createAudioContext(): AudioContext;
  releaseAudioContext(context: AudioContext): void;
  now(): number;
  requestFrame(callback: () => void): number;
  cancelFrame(handle: number): void;
  isHidden(): boolean;
  viewportHeight(): number;
  watchReducedMotion(onChange: (reduced: boolean) => void): { reduced: boolean; dispose(): void };
  onUserGesture(callback: () => void): () => void;
  fetchArrayBuffer(url: string): Promise<ArrayBuffer>;
  /** Surfaces an exception thrown by an event handler without breaking the scroll loop. */
  reportError(error: unknown): void;
}

type AudioContextConstructor = new () => AudioContext;

function audioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const scope = window as unknown as {
    AudioContext?: AudioContextConstructor;
    webkitAudioContext?: AudioContextConstructor;
  };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/** True when the Web Audio API is available. Always false on the server. */
export const isSupported = (): boolean => audioContextConstructor() !== undefined;

/** Contexts created by Pue JS, resumed by unlock(). */
export const trackedContexts = new Set<AudioContext>();

const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

export function browserEnvironment(): Environment {
  return {
    createAudioContext() {
      const Constructor = audioContextConstructor();
      if (!Constructor) throw new Error("The Web Audio API is not available.");
      const context = new Constructor();
      trackedContexts.add(context);
      return context;
    },
    releaseAudioContext(context) {
      trackedContexts.delete(context);
      void context.close().catch(() => undefined);
    },
    now: () => performance.now(),
    requestFrame: (callback) => window.requestAnimationFrame(() => callback()),
    cancelFrame: (handle) => window.cancelAnimationFrame(handle),
    isHidden: () => document.visibilityState === "hidden",
    viewportHeight: () => window.innerHeight,
    watchReducedMotion(onChange) {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (event: MediaQueryListEvent): void => onChange(event.matches);
      query.addEventListener("change", listener);
      return { reduced: query.matches, dispose: () => query.removeEventListener("change", listener) };
    },
    onUserGesture(callback) {
      const options = { capture: true, passive: true };
      for (const type of GESTURES) window.addEventListener(type, callback, options);
      return () => {
        for (const type of GESTURES) window.removeEventListener(type, callback, options);
      };
    },
    async fetchArrayBuffer(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request for ${url} failed with status ${response.status}.`);
      return response.arrayBuffer();
    },
    reportError(error) {
      queueMicrotask(() => {
        throw error;
      });
    },
  };
}
