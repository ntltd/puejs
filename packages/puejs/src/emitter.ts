import { PueError, destroyedError } from "./errors";
import type { Environment } from "./environment";
import { createKinematics, updateKinematics, type KinematicsState } from "./kinematics";
import { isOdor, type Odor } from "./odor";
import { assertOptionsObject, resolveOptions } from "./options";
import { loadOdor, playVoice } from "./playback";
import { createRandom } from "./random";
import { selectOdor } from "./selection";
import { canEmit, type ThrottleState } from "./throttle";
import { computeTonnage } from "./tonnage";
import type {
  EmissionInput,
  Emitter,
  EmitterEventHandler,
  EmitterEvents,
  EmitterOptions,
  EmitterState,
  ResolvedOptions,
} from "./types";

export type ScrollTarget = Window | Element;

export const MAX_VOICES = 6;
/** Time without movement after which the frame loop stops, in milliseconds. */
export const IDLE_TIMEOUT = 150;
/** Lead time applied to every emission to absorb scheduling jitter, in seconds. */
export const SCHEDULE_AHEAD = 0.005;
/** How long start() waits for a pending resume() before settling on "suspended", in milliseconds. */
export const RESUME_GRACE = 100;

/** Resolves when the promise settles or after the timeout, whichever comes first. Never rejects. */
export const settleWithin = (promise: Promise<unknown>, milliseconds: number): Promise<void> =>
  new Promise((resolve) => {
    const timeout = setTimeout(resolve, milliseconds);
    void promise.then(
      () => {
        clearTimeout(timeout);
        resolve();
      },
      () => {
        clearTimeout(timeout);
        resolve();
      },
    );
  });

export const readScrollPosition = (target: ScrollTarget): number =>
  "scrollY" in target ? target.scrollY : target.scrollTop;

/** Visible height of the scroll container: the viewport for a window, the element's own height otherwise. */
const containerHeight = (target: ScrollTarget, env: Environment): number =>
  "scrollY" in target ? env.viewportHeight() : target.clientHeight;

type Handler = (payload: unknown) => void;

export function createEmitterWithEnvironment(
  target: ScrollTarget,
  options: EmitterOptions | undefined,
  env: Environment,
): Emitter {
  let resolved: ResolvedOptions = resolveOptions(options);
  let userOptions: EmitterOptions = { ...options };
  let state: EmitterState = "idle";
  let context: AudioContext | null = null;
  let ownsContext = false;
  let startToken = 0;
  let pendingStart: Promise<void> | null = null;
  const handlers = new Map<keyof EmitterEvents, Set<Handler>>();
  const random = createRandom();
  const buffers = new Map<Odor, AudioBuffer>();
  const voices: AudioBufferSourceNode[] = [];
  let kinematics: KinematicsState | null = null;
  let throttleState: ThrottleState = { lastTime: Number.NEGATIVE_INFINITY, lastPosition: 0 };
  let frame: number | null = null;
  let lastMovement = 0;
  let reducedMotion = false;
  let cleanups: Array<() => void> = [];
  let disarmUnlock: (() => void) | null = null;
  // Window and Element have incompatible addEventListener overloads; both are EventTargets.
  const scrollEvents: EventTarget = target;

  function dispatch<E extends keyof EmitterEvents>(event: E, payload: EmitterEvents[E]): void {
    const set = handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (error) {
        env.reportError(error);
      }
    }
  }

  function setState(next: EmitterState): void {
    if (next === state) return;
    const previous = state;
    state = next;
    dispatch("statechange", { previous, current: next });
  }

  function assertAlive(): void {
    if (state === "destroyed") throw destroyedError();
  }

  async function decode(odors: readonly Odor[]): Promise<void> {
    const ctx = context;
    if (!ctx) return;
    await Promise.all(
      odors.map(async (odor) => {
        if (buffers.has(odor)) return;
        try {
          const buffer = await loadOdor(ctx, odor, (url) => env.fetchArrayBuffer(url));
          if (context === ctx) buffers.set(odor, buffer);
        } catch (cause) {
          if (context === ctx) {
            dispatch("error", new PueError("E_DECODE", `The odor "${odor.name}" could not be decoded.`, { cause }));
          }
        }
      }),
    );
  }

  function play(tonnage: number, velocity: number, direction: 1 | -1, detectedAt: number, forced?: Odor): boolean {
    const ctx = context;
    if (!ctx) return false;
    const candidates = resolved.odors.filter((odor) => buffers.has(odor));
    const odor = forced ?? selectOdor(candidates, tonnage, random);
    const buffer = odor ? buffers.get(odor) : undefined;
    if (!odor || !buffer) return false;

    const pitch = resolved.pitch.min + (resolved.pitch.max - resolved.pitch.min) * random();
    if (voices.length >= MAX_VOICES) {
      try {
        voices.shift()?.stop();
      } catch {
        // The oldest voice already ended.
      }
    }
    const when = ctx.currentTime + SCHEDULE_AHEAD;
    const source = playVoice(
      ctx,
      buffer,
      {
        pitch,
        resonance: resolved.resonance,
        duration: resolved.duration,
        gain: resolved.volume * (0.25 + 0.75 * tonnage),
        when,
      },
      () => {
        const index = voices.indexOf(source);
        if (index !== -1) voices.splice(index, 1);
      },
    );
    voices.push(source);
    dispatch("emit", {
      tonnage,
      velocity,
      direction,
      pitch,
      odor: odor.name,
      latency: env.now() - detectedAt,
      timestamp: when,
    });
    return true;
  }

  function detect(now: number, position: number, signedVelocity: number): void {
    if (state !== "running") return;
    if (env.isHidden() || (resolved.respectReducedMotion && reducedMotion)) return;
    const velocity = Math.abs(signedVelocity);
    if (velocity < resolved.threshold) return;
    const tonnage = computeTonnage(velocity, resolved.threshold, resolved.tonnage);
    const frameInfo = { time: now, position, tonnage, viewportHeight: containerHeight(target, env) };
    if (!canEmit(resolved.throttle, throttleState, frameInfo)) return;
    if (play(tonnage, velocity, signedVelocity < 0 ? -1 : 1, now)) {
      throttleState = { lastTime: now, lastPosition: position };
    }
  }

  const tick = (): void => {
    frame = null;
    const now = env.now();
    const position = readScrollPosition(target);
    if (kinematics === null) {
      kinematics = createKinematics(position, now);
      lastMovement = now;
      frame = env.requestFrame(tick);
      return;
    }
    const moved = position !== kinematics.position;
    kinematics = updateKinematics(kinematics, position, now);
    if (moved) {
      lastMovement = now;
      detect(now, position, kinematics.velocity);
    }
    if (now - lastMovement < IDLE_TIMEOUT) frame = env.requestFrame(tick);
    else kinematics = null;
  };

  const onScroll = (): void => {
    if (frame === null) frame = env.requestFrame(tick);
  };

  function armUnlock(): void {
    const ctx = context;
    if (!resolved.autoUnlock || disarmUnlock || !ctx) return;
    disarmUnlock = env.onUserGesture(() => {
      void ctx.resume().catch(() => undefined);
    });
  }

  function syncContextState(): void {
    if (!context || state === "idle" || state === "destroyed") return;
    if (context.state === "running" && state === "suspended") {
      disarmUnlock?.();
      disarmUnlock = null;
      setState("running");
      dispatch("unlock", { context });
    } else if (context.state !== "running" && state === "running") {
      setState("suspended");
      armUnlock();
    }
  }

  function attach(ctx: AudioContext): void {
    const onStateChange = (): void => syncContextState();
    ctx.addEventListener("statechange", onStateChange);
    scrollEvents.addEventListener("scroll", onScroll, { passive: true });
    const watcher = env.watchReducedMotion((reduced) => {
      reducedMotion = reduced;
    });
    reducedMotion = watcher.reduced;
    throttleState = { lastTime: Number.NEGATIVE_INFINITY, lastPosition: readScrollPosition(target) };
    cleanups = [
      () => ctx.removeEventListener("statechange", onStateChange),
      () => scrollEvents.removeEventListener("scroll", onScroll),
      () => watcher.dispose(),
    ];
  }

  function detach(): void {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    disarmUnlock?.();
    disarmUnlock = null;
    if (frame !== null) {
      env.cancelFrame(frame);
      frame = null;
    }
    kinematics = null;
  }

  return {
    get state() {
      return state;
    },
    get context() {
      return context;
    },
    get options() {
      return resolved;
    },

    start() {
      assertAlive();
      if (state === "suspended" && context) {
        // Called again from a gesture: resume synchronously to unlock audio.
        void context.resume().catch(() => undefined);
        return Promise.resolve();
      }
      if (state !== "idle") return Promise.resolve();
      if (pendingStart) return pendingStart;
      const token = ++startToken;
      if (!context) {
        ownsContext = resolved.audioContext === undefined;
        context = resolved.audioContext ?? env.createAudioContext();
      }
      const ctx = context;
      attach(ctx);
      // Resume synchronously so that a call made from a user gesture unlocks audio. Only awaited with a
      // timeout: without activation, some browsers keep this promise pending until the next gesture.
      const resumed = ctx.resume().catch(() => undefined);
      const promise: Promise<void> = decode(resolved.odors)
        // Real devices switch to "running" asynchronously: give a pending resume a short grace period.
        .then(() => (ctx.state === "running" ? undefined : settleWithin(resumed, RESUME_GRACE)))
        .then(() => {
          if (token !== startToken) return;
          if (ctx.state === "running") {
            setState("running");
          } else {
            setState("suspended");
            armUnlock();
          }
        })
        .finally(() => {
          if (pendingStart === promise) pendingStart = null;
        });
      pendingStart = promise;
      return promise;
    },

    stop() {
      assertAlive();
      if (state === "idle" && !pendingStart) return;
      startToken++;
      pendingStart = null;
      detach();
      setState("idle");
    },

    update(partial) {
      assertAlive();
      assertOptionsObject(partial);
      if (context && partial.audioContext !== undefined && partial.audioContext !== resolved.audioContext) {
        throw new PueError("E_INVALID_OPTION", 'The "audioContext" option cannot be changed after start().');
      }
      const nextOptions = { ...userOptions, ...partial };
      resolved = resolveOptions(nextOptions);
      userOptions = nextOptions;
      if (context) void decode(resolved.odors);
    },

    emit(input: EmissionInput = {}) {
      assertAlive();
      const tonnage = input.tonnage ?? 0.5;
      if (typeof tonnage !== "number" || !Number.isFinite(tonnage) || tonnage < 0 || tonnage > 1) {
        throw new PueError("E_INVALID_OPTION", 'Invalid emission "tonnage": expected a number between 0 and 1.');
      }
      if (input.odor !== undefined && !isOdor(input.odor)) {
        throw new PueError("E_INVALID_OPTION", 'Invalid emission "odor": expected an odor.');
      }
      if (state !== "running") return;
      const { odor } = input;
      if (odor && !buffers.has(odor)) {
        // Decode first, then play if the emitter is still running.
        const token = startToken;
        void decode([odor]).then(() => {
          if (token === startToken && state === "running") play(tonnage, 0, 1, env.now(), odor);
        });
        return;
      }
      play(tonnage, 0, 1, env.now(), odor);
    },

    on<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>) {
      assertAlive();
      let set = handlers.get(event);
      if (!set) {
        set = new Set();
        handlers.set(event, set);
      }
      set.add(handler as Handler);
      return () => {
        handlers.get(event)?.delete(handler as Handler);
      };
    },

    off<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>) {
      handlers.get(event)?.delete(handler as Handler);
    },

    destroy() {
      if (state === "destroyed") return;
      startToken++;
      pendingStart = null;
      detach();
      for (const voice of voices.splice(0)) {
        try {
          voice.stop();
        } catch {
          // Already ended.
        }
      }
      if (context && ownsContext) env.releaseAudioContext(context);
      context = null;
      buffers.clear();
      setState("destroyed");
      handlers.clear();
    },
  };
}
