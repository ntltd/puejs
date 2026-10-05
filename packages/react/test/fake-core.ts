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

export function createFakeEmitter(target: unknown, options: unknown): FakeEmitter {
  const listeners = new Set<StateListener>();
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
    start: vi.fn(async () => emitter.setState("running")),
    stop: vi.fn(() => emitter.setState("idle")),
    update: vi.fn((next: unknown) => {
      emitter.options = next;
    }),
    emit: vi.fn(),
    destroy: vi.fn(() => {
      if (emitter.destroyed) return;
      emitter.destroyed = true;
      emitter.setState("destroyed");
      listeners.clear();
    }),
    on: vi.fn((event: string, listener: StateListener) => {
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
