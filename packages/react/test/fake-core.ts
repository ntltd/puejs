import { type Mock, vi } from "vitest";

type StateListener = (payload: { previous: string; current: string }) => void;

export interface FakeEmitter {
  target: unknown;
  options: unknown;
  state: string;
  destroyed: boolean;
  setState(next: string): void;
  start: Mock<() => Promise<void>>;
  stop: Mock<() => void>;
  update: Mock<(next: unknown) => void>;
  emit: Mock<(input?: unknown) => void>;
  destroy: Mock<() => void>;
  on: Mock<(event: string, listener: StateListener) => () => void>;
  off: Mock<() => void>;
}

/** Every emitter created by the mocked createEmitter, in order. */
export const fakes: FakeEmitter[] = [];

const destroyedError = (): Error =>
  Object.assign(new Error("This emitter has been destroyed."), { code: "E_DESTROYED" });

export function createFakeEmitter(target: unknown, options: unknown): FakeEmitter {
  const listeners = new Set<StateListener>();
  const alive = (): void => {
    if (emitter.destroyed) throw destroyedError();
  };
  const emitter: FakeEmitter = {
    target,
    options,
    state: "idle",
    destroyed: false,
    setState(next: string): void {
      const previous = emitter.state;
      emitter.state = next;
      for (const listener of [...listeners]) listener({ previous, current: next });
    },
    start: vi.fn(() => {
      alive();
      emitter.setState("running");
      return Promise.resolve();
    }),
    stop: vi.fn(() => {
      alive();
      emitter.setState("idle");
    }),
    update: vi.fn((next: unknown) => {
      alive();
      emitter.options = next;
    }),
    emit: vi.fn(() => alive()),
    destroy: vi.fn(() => {
      if (emitter.destroyed) return;
      emitter.destroyed = true;
      emitter.setState("destroyed");
      listeners.clear();
    }),
    on: vi.fn((event: string, listener: StateListener) => {
      alive();
      if (event === "statechange") listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }),
    off: vi.fn(),
  };
  fakes.push(emitter);
  return emitter;
}

export const liveFakes = (): FakeEmitter[] => fakes.filter((fake) => !fake.destroyed);
