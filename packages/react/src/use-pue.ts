import { createEmitter, type EmissionInput, type Emitter, type EmitterOptions, type EmitterState } from "@puejs/core";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { mergeOptions, sameOptions } from "./equal";
import { usePueContext } from "./provider";

export interface UsePueConfig {
  /** Start the emitter as soon as it exists. Audio stays suspended until a user gesture. */
  autoStart?: boolean;
}

export interface UsePueResult<T extends Element> {
  /** Ref callback for the scroll container. Without it, the hook observes window. */
  ref: (element: T | null) => void;
  state: EmitterState;
  start: () => Promise<void>;
  stop: () => void;
  emit: (input?: EmissionInput) => void;
  emitter: Emitter | null;
}

const noopUnsubscribe = (): void => undefined;
const isAlive = (emitter: Emitter | null): emitter is Emitter => emitter !== null && emitter.state !== "destroyed";

/** Options sent to update(): the audio context is immutable, and removed keys revert to their defaults. */
function updatePayload(previous: EmitterOptions, next: EmitterOptions): Partial<EmitterOptions> {
  const after: Partial<EmitterOptions> = { ...next };
  delete after.audioContext;
  const removed = Object.keys(previous).filter((key) => key !== "audioContext" && !(key in after));
  return { ...Object.fromEntries(removed.map((key) => [key, undefined])), ...after };
}

/** Binds a Pue JS emitter to the component lifecycle. Audio starts only through start() (or autoStart). */
export function usePue<T extends Element = Element>(
  options: EmitterOptions | false = {},
  config: UsePueConfig = {},
): UsePueResult<T> {
  const { defaults, audioContext } = usePueContext();
  const effective = options === false ? null : mergeOptions(defaults, options, audioContext);

  // Stable reference while the options are equal by value. Idempotent, so safe to compute during render.
  const optionsRef = useRef(effective);
  if (effective === null || optionsRef.current === null || !sameOptions(optionsRef.current, effective)) {
    optionsRef.current = effective;
  }
  const stableOptions = optionsRef.current;

  const [emitter, setEmitter] = useState<Emitter | null>(null);
  const emitterRef = useRef<Emitter | null>(null);
  const appliedRef = useRef<EmitterOptions | null>(null);

  // Target tracking. Refs are attached before effects run, so the first emitter binds to the element directly.
  const elementRef = useRef<T | null>(null);
  const attachedRef = useRef(false);
  const boundRef = useRef<EventTarget | null>(null);
  const mountedRef = useRef(false);
  const [targetVersion, setTargetVersion] = useState(0);

  const resolveTarget = useCallback(
    // Once an element has been attached, losing it disables the emitter instead of falling back to window.
    (): EventTarget | null => elementRef.current ?? (attachedRef.current ? null : window),
    [],
  );

  const ref = useCallback(
    (element: T | null) => {
      elementRef.current = element;
      if (element) attachedRef.current = true;
      if (mountedRef.current && resolveTarget() !== boundRef.current) setTargetVersion((version) => version + 1);
    },
    [resolveTarget],
  );

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const enabled = stableOptions !== null;
  const sharedContext = stableOptions?.audioContext;
  const { autoStart = false } = config;
  const latestOptions = useRef(stableOptions);
  latestOptions.current = stableOptions;

  useEffect(() => {
    const initial = latestOptions.current;
    const target = resolveTarget();
    if (!enabled || initial === null || target === null) return;
    const instance = createEmitter(target as Window | Element, initial);
    emitterRef.current = instance;
    boundRef.current = target;
    appliedRef.current = initial;
    setEmitter(instance);
    if (autoStart) void instance.start();
    return () => {
      instance.destroy();
      if (emitterRef.current === instance) {
        emitterRef.current = null;
        boundRef.current = null;
      }
      setEmitter((current) => (current === instance ? null : current));
    };
    // targetVersion and sharedContext are triggers: the effect reads the current target and options itself.
  }, [enabled, targetVersion, sharedContext, autoStart, resolveTarget]);

  useEffect(() => {
    const applied = appliedRef.current;
    if (!isAlive(emitter) || stableOptions === null || applied === null || stableOptions === applied) return;
    emitter.update(updatePayload(applied, stableOptions));
    appliedRef.current = stableOptions;
  }, [emitter, stableOptions]);

  const subscribe = useCallback(
    (onChange: () => void) => (isAlive(emitter) ? emitter.on("statechange", onChange) : noopUnsubscribe),
    [emitter],
  );
  const state = useSyncExternalStore(
    subscribe,
    (): EmitterState => (isAlive(emitter) ? emitter.state : "idle"),
    (): EmitterState => "idle",
  );

  // Stable identities, safe to call after the emitter is gone.
  const start = useCallback((): Promise<void> => {
    const current = emitterRef.current;
    return isAlive(current) ? current.start() : Promise.resolve();
  }, []);
  const stop = useCallback((): void => {
    const current = emitterRef.current;
    if (isAlive(current)) current.stop();
  }, []);
  const emit = useCallback((input?: EmissionInput): void => {
    const current = emitterRef.current;
    if (isAlive(current)) current.emit(input);
  }, []);

  return { ref, state, start, stop, emit, emitter };
}
