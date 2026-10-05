import { destroyedError } from "./errors";
import { assertOptionsObject, resolveOptions } from "./options";
import type { Emitter, EmitterOptions, EmitterState } from "./types";

/** Same API as a real emitter, for servers and browsers without Web Audio. Never emits. */
export function createInertEmitter(options?: EmitterOptions): Emitter {
  let resolved = resolveOptions(options);
  let userOptions: EmitterOptions = { ...options };
  let state: EmitterState = "idle";
  const assertAlive = (): void => {
    if (state === "destroyed") throw destroyedError();
  };

  return {
    get state() {
      return state;
    },
    get context() {
      return null;
    },
    get options() {
      return resolved;
    },
    start() {
      assertAlive();
      return Promise.resolve();
    },
    stop() {
      assertAlive();
    },
    update(partial) {
      assertAlive();
      assertOptionsObject(partial);
      const nextOptions = { ...userOptions, ...partial };
      resolved = resolveOptions(nextOptions);
      userOptions = nextOptions;
    },
    emit() {
      assertAlive();
    },
    on() {
      assertAlive();
      return () => undefined;
    },
    off() {},
    destroy() {
      state = "destroyed";
    },
  };
}
