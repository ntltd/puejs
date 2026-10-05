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

/** Binds a Pue JS emitter to the component lifecycle. Audio starts only through start() (or autoStart). */
export function usePue<T extends Element = Element>(
  options: EmitterOptions | false = {},
  config: UsePueConfig = {},
): UsePueResult<T> {
  const { defaults, audioContext } = usePueContext();
  const effective = options === false ? null : mergeOptions(defaults, options, audioContext);

  // Keep a stable reference while the options are equal by value (adjusting state during render).
  const [stableOptions, setStableOptions] = useState(effective);
  if (effective === null ? stableOptions !== null : stableOptions === null || !sameOptions(stableOptions, effective)) {
    setStableOptions(effective);
  }

  const [target, setTarget] = useState<T | null>(null);
  const ref = useCallback((element: T | null) => setTarget(element), []);
  const [emitter, setEmitter] = useState<Emitter | null>(null);

  const latestOptions = useRef(stableOptions);
  const appliedOptions = useRef<EmitterOptions | null>(null);
  useEffect(() => {
    latestOptions.current = stableOptions;
  });

  const enabled = stableOptions !== null;
  const { autoStart = false } = config;

  useEffect(() => {
    const initial = latestOptions.current;
    if (!enabled || initial === null) return;
    const instance = createEmitter(target ?? window, initial);
    appliedOptions.current = initial;
    setEmitter(instance);
    if (autoStart) void instance.start();
    return () => {
      instance.destroy();
      setEmitter((current) => (current === instance ? null : current));
    };
  }, [enabled, target, autoStart]);

  useEffect(() => {
    if (!emitter || stableOptions === null || stableOptions === appliedOptions.current) return;
    emitter.update(stableOptions);
    appliedOptions.current = stableOptions;
  }, [emitter, stableOptions]);

  const subscribe = useCallback(
    (onChange: () => void) => (emitter ? emitter.on("statechange", onChange) : noopUnsubscribe),
    [emitter],
  );
  const state = useSyncExternalStore(
    subscribe,
    (): EmitterState => (emitter && emitter.state !== "destroyed" ? emitter.state : "idle"),
    (): EmitterState => "idle",
  );

  const start = useCallback(() => (emitter ? emitter.start() : Promise.resolve()), [emitter]);
  const stop = useCallback(() => emitter?.stop(), [emitter]);
  const emit = useCallback((input?: EmissionInput) => emitter?.emit(input), [emitter]);

  return { ref, state, start, stop, emit, emitter };
}
