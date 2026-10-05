# @puejs/react Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship `@puejs/react` — a `usePue` hook and a `PueProvider` that bind a `@puejs/core` emitter to a React component lifecycle — and document it on puejs.org.

**Architecture:** One emitter per hook instance, created in an effect (never on the server) on the element passed to a ref callback, or on `window`. Effective options (provider defaults merged under hook options) are stabilised by value comparison, then applied with `emitter.update()`. State is read with `useSyncExternalStore` from the emitter's `statechange` event. Tests mock `@puejs/core` with a recording fake emitter.

**Tech Stack:** React 18/19, TypeScript 6, tsdown 0.23, vitest 5, React Testing Library 16, happy-dom 20.

**Spec:** `docs/superpowers/specs/2026-10-05-puejs-react-adapter-design.md`

## Global Constraints

- Package `@puejs/react`, version `1.0.0`, Unlicense, ESM only, `"sideEffects": false`, folder `packages/react`.
- Zero dependencies. Peer dependencies: `"@puejs/core": "^1.0.0"`, `"react": "^18.0.0 || ^19.0.0"`. Neither is bundled.
- The built `dist/index.js` starts with `"use client";`.
- `usePue` never starts audio unless `config.autoStart` is `true`.
- Use `<Context.Provider>` (React 18 compatible), not `<Context value>`.
- Work on branch `feat/react-adapter`; commit after each task; never push or publish without an explicit request.
- Commit messages: lowercase conventional commits, no attribution trailer.

## Review Focus

- **Inline options object on every render** — must not call `emitter.update()` when nothing changed. Test in Task 2.
- **Strict Mode double mount** — exactly one live emitter afterwards. Test in Task 2.
- **Ref attached on first commit** — the final emitter must target the element, earlier ones destroyed. Test in Task 2.
- **`usePue(false)` then re-enabled** — old emitter destroyed, new one created, `state` back to `idle` in between. Test in Task 2.
- **Server render** — no emitter, `state === "idle"`, `start()` resolves. Test in Task 2 (`renderToString`).

---

### Task 1: Package scaffold and option comparison

**Files:**
- Create: `packages/react/package.json`, `tsconfig.json`, `tsdown.config.ts`, `vitest.config.ts`, `eslint.config.js`, `.gitignore`, `LICENSE`
- Create: `packages/react/src/equal.ts`
- Test: `packages/react/test/equal.test.ts`

**Interfaces:**
- Produces: `sameOptions(a: EmitterOptions, b: EmitterOptions): boolean`, `mergeOptions(defaults: EmitterOptions | undefined, options: EmitterOptions, audioContext?: AudioContext): EmitterOptions`.

- [ ] **Step 1: Create the package files**

`packages/react/package.json`:

```json
{
  "name": "@puejs/react",
  "version": "1.0.0",
  "description": "React adapter for Pue JS acoustic scroll feedback.",
  "license": "Unlicense",
  "homepage": "https://www.puejs.org/docs/ecosystem",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ntltd/puejs.git",
    "directory": "packages/react"
  },
  "keywords": ["react", "hook", "scroll", "audio", "web-audio", "puejs"],
  "type": "module",
  "sideEffects": false,
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./package.json": "./package.json"
  },
  "files": ["dist"],
  "publishConfig": {
    "access": "public"
  },
  "scripts": {
    "build": "tsdown",
    "dev": "tsdown --watch",
    "test": "vitest run",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "prepublishOnly": "tsdown"
  },
  "peerDependencies": {
    "@puejs/core": "^1.0.0",
    "react": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "@puejs/core": "*",
    "@testing-library/react": "^16.3.3",
    "@types/node": "^24.19.1",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "eslint": "^9.39.5",
    "eslint-config-custom": "*",
    "happy-dom": "^20.14.5",
    "react": "^19.3.0",
    "react-dom": "^19.3.0",
    "tsconfig": "*",
    "tsdown": "^0.23.0",
    "typescript": "^6.0.3",
    "vite": "^8.3.2",
    "vitest": "^5.0.3"
  }
}
```

`packages/react/tsconfig.json`:

```json
{
  "extends": "tsconfig/library.json",
  "compilerOptions": {
    "jsx": "react-jsx"
  },
  "include": ["src", "test", "tsdown.config.ts", "vitest.config.ts"]
}
```

`packages/react/tsdown.config.ts`:

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: "esm",
  dts: true,
  platform: "neutral",
  target: "es2022",
  clean: true,
  // Client-only hooks: lets the Next.js App Router import the adapter from server components.
  banner: { js: '"use client";' },
});
```

`packages/react/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["test/**/*.test.{ts,tsx}"],
  },
});
```

`packages/react/eslint.config.js`:

```js
import library from "eslint-config-custom/library";

export default library;
```

`packages/react/.gitignore`: `dist`

Copy the license: `cp LICENSE packages/react/LICENSE`

Run: `yarn install`
Expected: `success Saved lockfile.`; `node_modules/@puejs/react` links to `packages/react`.

- [ ] **Step 2: Write the failing test**

`packages/react/test/equal.test.ts`:

```ts
import { defineOdor, type EmitterOptions } from "@puejs/core";
import { describe, expect, it } from "vitest";
import { mergeOptions, sameOptions } from "../src/equal";

const a = defineOdor({ name: "a", src: "/a.mp3" });
const b = defineOdor({ name: "b", src: "/b.mp3" });
const curve = (velocity: number) => velocity / 3000;

describe("sameOptions", () => {
  it("treats structurally equal options as equal", () => {
    expect(sameOptions({ preset: "crisp", volume: 0.5 }, { preset: "crisp", volume: 0.5 })).toBe(true);
    expect(sameOptions({ pitch: { min: 0.9, max: 1.1 } }, { pitch: { min: 0.9, max: 1.1 } })).toBe(true);
    expect(sameOptions({ odors: [a, b] }, { odors: [a, b] })).toBe(true);
    expect(sameOptions({ tonnage: curve }, { tonnage: curve })).toBe(true);
    expect(sameOptions({ volume: undefined }, {})).toBe(true);
  });

  it("detects real changes", () => {
    expect(sameOptions({ volume: 0.5 }, { volume: 0.6 })).toBe(false);
    expect(sameOptions({ pitch: { min: 0.9, max: 1.1 } }, { pitch: { min: 0.9, max: 1.2 } })).toBe(false);
    expect(sameOptions({ pitch: 1 }, { pitch: { min: 1, max: 1 } })).toBe(false);
    expect(sameOptions({ odors: [a, b] }, { odors: [b, a] })).toBe(false);
    expect(sameOptions({ odors: [a] }, { odors: [a, b] })).toBe(false);
    expect(sameOptions({ tonnage: curve }, { tonnage: (velocity: number) => velocity / 3000 })).toBe(false);
    expect(sameOptions({}, { threshold: 100 })).toBe(false);
  });
});

describe("mergeOptions", () => {
  it("merges defaults under options and injects the shared context", () => {
    const context = {} as AudioContext;
    const defaults: EmitterOptions = { preset: "deep", volume: 0.3 };
    expect(mergeOptions(defaults, { volume: 0.9 }, context)).toEqual({
      preset: "deep",
      volume: 0.9,
      audioContext: context,
    });
  });

  it("keeps the hook's own audio context over the shared one", () => {
    const own = {} as AudioContext;
    expect(mergeOptions(undefined, { audioContext: own }, {} as AudioContext).audioContext).toBe(own);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `yarn workspace @puejs/react test`
Expected: FAIL — cannot resolve `../src/equal`.

- [ ] **Step 4: Implement**

`packages/react/src/equal.ts`:

```ts
import type { EmitterOptions, PitchRange } from "@puejs/core";

const samePitch = (a: EmitterOptions["pitch"], b: EmitterOptions["pitch"]): boolean => {
  if (typeof a !== "object" || typeof b !== "object") return a === b;
  return (a as PitchRange).min === (b as PitchRange).min && (a as PitchRange).max === (b as PitchRange).max;
};

const sameList = (a: readonly unknown[] | undefined, b: readonly unknown[] | undefined): boolean =>
  a === b || (a !== undefined && b !== undefined && a.length === b.length && a.every((item, index) => item === b[index]));

/**
 * Compares emitter options by value: pitch ranges structurally, odor lists element by element,
 * everything else (primitives, presets, curves, contexts) by identity.
 */
export function sameOptions(a: EmitterOptions, b: EmitterOptions): boolean {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]) as Set<keyof EmitterOptions>;
  for (const key of keys) {
    if (key === "pitch") {
      if (!samePitch(a.pitch, b.pitch)) return false;
    } else if (key === "odors") {
      if (!sameList(a.odors, b.odors)) return false;
    } else if (a[key] !== b[key]) {
      return false;
    }
  }
  return true;
}

/** Provider defaults under the hook's options; the shared context only when the hook sets none. */
export function mergeOptions(
  defaults: EmitterOptions | undefined,
  options: EmitterOptions,
  audioContext?: AudioContext,
): EmitterOptions {
  const merged: EmitterOptions = { ...defaults, ...options };
  if (audioContext && merged.audioContext === undefined) merged.audioContext = audioContext;
  return merged;
}
```

- [ ] **Step 5: Run it to verify it passes**

Run: `yarn workspace @puejs/react test && yarn workspace @puejs/react typecheck && yarn workspace @puejs/react lint`
Expected: PASS, no type or lint errors.

- [ ] **Step 6: Commit**

```bash
git add packages/react yarn.lock
git commit -m "feat(react): scaffold @puejs/react with option comparison"
```

---

### Task 2: `PueProvider` and `usePue`

**Files:**
- Create: `packages/react/src/provider.tsx`, `packages/react/src/use-pue.ts`, `packages/react/src/index.ts`
- Create: `packages/react/test/fake-core.ts`
- Test: `packages/react/test/use-pue.test.tsx`, `packages/react/test/provider.test.tsx`

**Interfaces:**
- Consumes: `sameOptions`, `mergeOptions` (Task 1); `createEmitter`, `Emitter`, `EmitterOptions`, `EmitterState`, `EmissionInput` from `@puejs/core`.
- Produces: `usePue<T extends Element = Element>(options?: EmitterOptions | false, config?: UsePueConfig): UsePueResult<T>`, `UsePueConfig { autoStart?: boolean }`, `UsePueResult<T> { ref; state; start; stop; emit; emitter }`, `PueProvider({ defaults?, audioContext?, children })`, `PueProviderProps`.

- [ ] **Step 1: Write the fake core**

`packages/react/test/fake-core.ts`:

```ts
import { vi } from "vitest";

type StateListener = (payload: { previous: string; current: string }) => void;

export type FakeEmitter = ReturnType<typeof createFakeEmitter>;

/** Every emitter created by the mocked createEmitter, in order. */
export const fakes: FakeEmitter[] = [];

export function createFakeEmitter(target: unknown, options: unknown) {
  const listeners = new Set<StateListener>();
  const emitter = {
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
```

- [ ] **Step 2: Write the failing tests**

`packages/react/test/use-pue.test.tsx`:

```tsx
import { createEmitter } from "@puejs/core";
import { act, render, renderHook, screen } from "@testing-library/react";
import { StrictMode, useState } from "react";
import { renderToString } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePue } from "../src";
import { fakes, liveFakes } from "./fake-core";

vi.mock("@puejs/core", async () => {
  const { createFakeEmitter } = await import("./fake-core");
  return { createEmitter: vi.fn(createFakeEmitter) };
});

beforeEach(() => {
  fakes.length = 0;
  vi.mocked(createEmitter).mockClear();
});

function Feed({ id = "feed" }: { id?: string }) {
  const { ref } = usePue<HTMLDivElement>({ preset: "crisp" });
  return <div data-testid={id} ref={ref} />;
}

describe("usePue", () => {
  it("observes window when the ref is unused, without starting audio", () => {
    const { result } = renderHook(() => usePue({ volume: 0.5 }));
    expect(liveFakes()).toHaveLength(1);
    const [emitter] = liveFakes();
    expect(emitter.target).toBe(window);
    expect(emitter.options).toEqual({ volume: 0.5 });
    expect(emitter.start).not.toHaveBeenCalled();
    expect(result.current.state).toBe("idle");
    expect(result.current.emitter).toBe(emitter);
  });

  it("binds to the element passed to ref", () => {
    render(<Feed />);
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("feed"));
  });

  it("does not update for equal inline options, only for real changes", () => {
    const { rerender } = renderHook(({ volume }) => usePue({ volume, pitch: { min: 0.9, max: 1.1 } }), {
      initialProps: { volume: 0.5 },
    });
    const [emitter] = liveFakes();
    rerender({ volume: 0.5 });
    rerender({ volume: 0.5 });
    expect(emitter.update).not.toHaveBeenCalled();
    rerender({ volume: 0.6 });
    expect(emitter.update).toHaveBeenCalledTimes(1);
    expect(emitter.update).toHaveBeenCalledWith({ volume: 0.6, pitch: { min: 0.9, max: 1.1 } });
    expect(liveFakes()).toHaveLength(1);
  });

  it("follows the emitter state and delegates start, stop and emit", async () => {
    const { result } = renderHook(() => usePue());
    const [emitter] = liveFakes();
    await act(() => result.current.start());
    expect(emitter.start).toHaveBeenCalledTimes(1);
    expect(result.current.state).toBe("running");
    act(() => result.current.emit({ tonnage: 1 }));
    expect(emitter.emit).toHaveBeenCalledWith({ tonnage: 1 });
    act(() => result.current.stop());
    expect(result.current.state).toBe("idle");
  });

  it("starts once with autoStart", async () => {
    renderHook(() => usePue({}, { autoStart: true }));
    await act(async () => {});
    expect(liveFakes()[0].start).toHaveBeenCalledTimes(1);
  });

  it("destroys the emitter when disabled and recreates it when re-enabled", () => {
    const { result, rerender } = renderHook(({ enabled }) => usePue(enabled ? { volume: 0.4 } : false), {
      initialProps: { enabled: true },
    });
    const [first] = liveFakes();
    rerender({ enabled: false });
    expect(first.destroyed).toBe(true);
    expect(result.current.emitter).toBeNull();
    expect(result.current.state).toBe("idle");
    rerender({ enabled: true });
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0]).not.toBe(first);
  });

  it("recreates the emitter when the ref moves to another element", () => {
    function Switcher() {
      const [second, setSecond] = useState(false);
      const { ref } = usePue<HTMLDivElement>();
      return (
        <>
          <button onClick={() => setSecond(true)} type="button">
            switch
          </button>
          <div data-testid="one" ref={second ? undefined : ref} />
          <div data-testid="two" ref={second ? ref : undefined} />
        </>
      );
    }
    render(<Switcher />);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("one"));
    act(() => screen.getByText("switch").click());
    expect(liveFakes()).toHaveLength(1);
    expect(liveFakes()[0].target).toBe(screen.getByTestId("two"));
  });

  it("destroys the emitter on unmount", () => {
    const { unmount } = renderHook(() => usePue());
    const [emitter] = liveFakes();
    unmount();
    expect(emitter.destroyed).toBe(true);
    expect(liveFakes()).toHaveLength(0);
  });

  it("leaves exactly one live emitter under Strict Mode", () => {
    renderHook(() => usePue(), { wrapper: StrictMode });
    expect(liveFakes()).toHaveLength(1);
  });

  it("renders on the server without creating an emitter", () => {
    let state: string | undefined;
    function Probe() {
      state = usePue().state;
      return null;
    }
    renderToString(<Probe />);
    expect(state).toBe("idle");
    expect(createEmitter).not.toHaveBeenCalled();
  });
});
```

`packages/react/test/provider.test.tsx`:

```tsx
import { createEmitter } from "@puejs/core";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PueProvider, usePue } from "../src";
import { fakes, liveFakes } from "./fake-core";

vi.mock("@puejs/core", async () => {
  const { createFakeEmitter } = await import("./fake-core");
  return { createEmitter: vi.fn(createFakeEmitter) };
});

beforeEach(() => {
  fakes.length = 0;
  vi.mocked(createEmitter).mockClear();
});

describe("PueProvider", () => {
  it("merges defaults under the hook's options", () => {
    renderHook(() => usePue({ volume: 0.9 }), {
      wrapper: ({ children }) => <PueProvider defaults={{ preset: "deep", volume: 0.3 }}>{children}</PueProvider>,
    });
    expect(liveFakes()[0].options).toEqual({ preset: "deep", volume: 0.9 });
  });

  it("shares its audio context", () => {
    const context = {} as AudioContext;
    renderHook(() => usePue(), {
      wrapper: ({ children }) => <PueProvider audioContext={context}>{children}</PueProvider>,
    });
    expect(liveFakes()[0].options).toEqual({ audioContext: context });
  });
});
```

- [ ] **Step 3: Run them to verify they fail**

Run: `yarn workspace @puejs/react test`
Expected: FAIL — cannot resolve `../src` (no `index.ts` yet).

- [ ] **Step 4: Implement**

`packages/react/src/provider.tsx`:

```tsx
import type { EmitterOptions } from "@puejs/core";
import { createContext, useContext, useMemo } from "react";

interface PueContextValue {
  defaults?: EmitterOptions;
  audioContext?: AudioContext;
}

const PueContext = createContext<PueContextValue>({});

export interface PueProviderProps {
  /** Options merged under every usePue() call in the subtree. */
  defaults?: EmitterOptions;
  /** Context shared by every emitter in the subtree. Never closed by the adapter. */
  audioContext?: AudioContext;
  children?: React.ReactNode;
}

export function PueProvider({ defaults, audioContext, children }: PueProviderProps): React.JSX.Element {
  const value = useMemo(() => ({ defaults, audioContext }), [defaults, audioContext]);
  return <PueContext.Provider value={value}>{children}</PueContext.Provider>;
}

export const usePueContext = (): PueContextValue => useContext(PueContext);
```

`packages/react/src/use-pue.ts`:

```ts
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
```

`packages/react/src/index.ts`:

```ts
export { PueProvider } from "./provider";
export type { PueProviderProps } from "./provider";
export { usePue } from "./use-pue";
export type { UsePueConfig, UsePueResult } from "./use-pue";
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn workspace @puejs/react test && yarn workspace @puejs/react typecheck && yarn workspace @puejs/react lint`
Expected: PASS (all `equal`, `usePue` and `PueProvider` tests), no type or lint errors.

- [ ] **Step 6: Commit**

```bash
git add packages/react
git commit -m "feat(react): add usePue and PueProvider"
```

---

### Task 3: Build, README and package checks

**Files:**
- Create: `packages/react/README.md`
- Modify: `README.md` (root)

- [ ] **Step 1: Build and check the bundle**

Run: `yarn workspace @puejs/react build && head -c 40 packages/react/dist/index.js`
Expected: build succeeds; the file starts with `"use client";`.

Run: `grep -c "createEmitter" packages/react/dist/index.js && grep -E "from \"(react|@puejs/core)\"" packages/react/dist/index.js`
Expected: `react` and `@puejs/core` are imported, not bundled.

Run: `cd packages/react && npm pack --dry-run 2>&1 | grep -E "name:|version:|total files|dist/|README|LICENSE"`
Expected: `@puejs/react@1.0.0`; only `dist/**`, `README.md`, `LICENSE`, `package.json`.

- [ ] **Step 2: Write the README**

`packages/react/README.md`:

````md
# @puejs/react

React adapter for [Pue JS](https://www.puejs.org): acoustic feedback for scroll interactions.

## Install

```sh
npm install @puejs/core @puejs/react
```

## Usage

```tsx
"use client";

import { usePue } from "@puejs/react";

export function Feed({ children }: { children: React.ReactNode }) {
  const { ref, state, start, stop } = usePue<HTMLDivElement>({ preset: "crisp" });

  return (
    <>
      <button aria-pressed={state === "running"} onClick={() => (state === "idle" ? start() : stop())} type="button">
        Acoustic feedback
      </button>
      <div ref={ref} style={{ overflowY: "auto", height: 400 }}>
        {children}
      </div>
    </>
  );
}
```

- `usePue(options, { autoStart })` creates the emitter on mount, applies option changes with `update()` and destroys it on unmount. Without `ref`, it observes `window`. Pass `false` to disable it.
- Audio only starts through `start()`, called from a user gesture, or with `autoStart: true`.
- Define custom tonnage curves outside the component: functions are compared by identity.

## Provider

```tsx
import { PueProvider } from "@puejs/react";

<PueProvider defaults={{ preset: "organic", volume: 0.6 }}>{children}</PueProvider>;
```

`defaults` are merged under every `usePue()` in the subtree, and `audioContext` is shared (never closed by the adapter).

## License

Released into the public domain under the [Unlicense](./LICENSE).
````

In the root `README.md`, under `## Stack`, after the line about `@puejs/core`'s package (or the docs app line), add:

```md
- `packages/react`: `@puejs/react`, the React adapter (`usePue`, `PueProvider`)
```

- [ ] **Step 3: Verify the whole repo**

Run: `yarn test && yarn lint && yarn typecheck && yarn build`
Expected: all green (core 106 tests + react tests).

- [ ] **Step 4: Commit**

```bash
git add packages/react README.md
git commit -m "docs(react): add the @puejs/react readme"
```

---

### Task 4: Documentation on puejs.org

**Files:**
- Modify: `apps/docs/app/docs/ecosystem/page.mdx`, `apps/docs/app/docs/accessibility/page.mdx`, `apps/docs/app/docs/api/page.mdx`, `apps/docs/app/docs/installation/page.mdx`, `apps/docs/components/landing/code-showcase.tsx`

- [ ] **Step 1: Ecosystem page**

Replace the `## React` section (from `## React` up to, not including, `## Vue`) with:

````mdx
## React

`@puejs/react` binds an emitter to the component lifecycle. It supports React 18 and 19, Strict Mode and the Next.js App Router.

```bash
npm install @puejs/core @puejs/react
```

```tsx
"use client";

import { usePue } from "@puejs/react";

export function Feed({ children }: { children: React.ReactNode }): React.JSX.Element {
  const { ref, state, start, stop } = usePue<HTMLDivElement>({ preset: "crisp" });

  return (
    <>
      <button aria-pressed={state === "running"} onClick={() => (state === "idle" ? start() : stop())} type="button">
        Acoustic feedback
      </button>
      <div ref={ref} style={{ overflowY: "auto", height: "100vh" }}>
        {children}
      </div>
    </>
  );
}
```

The emitter is created on mount, updated when options change and destroyed on unmount. Without `ref`, the hook observes `window`; passing `false` instead of options disables it. Audio only starts through `start()` — or `usePue(options, { autoStart: true })`, which still waits for a user gesture.

### Sharing defaults

Wrap your application in `PueProvider` to share default options and a single `AudioContext` between every `usePue` call:

```tsx
import { PueProvider } from "@puejs/react";

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="en">
      <body>
        <PueProvider defaults={{ preset: "organic", volume: 0.6 }}>{children}</PueProvider>
      </body>
    </html>
  );
}
```

<Callout type="note" title="Next.js App Router">
  The adapter ships with a `"use client"` directive, so `PueProvider` can be rendered from a server component layout.
</Callout>
````

In the Roadmap table, replace the row `| \`@puejs/react\`  | Planned |` with `| \`@puejs/react\`  | Available |`, and the sentence `Official adapters are planned to remove this boilerplate:` with `Official adapters remove this boilerplate:`. Change the page intro sentence `The core runtime is framework agnostic and works today with any framework: create the emitter in a client-side lifecycle hook and destroy it on cleanup.` to `The core runtime is framework agnostic. React has an official adapter; with other frameworks, create the emitter in a client-side lifecycle hook and destroy it on cleanup.`

- [ ] **Step 2: Accessibility page**

Replace the code block under `## Provide a control` with:

````mdx
```tsx
"use client";

import { usePue } from "@puejs/react";

export function AcousticToggle(): React.JSX.Element {
  const { state, start, stop } = usePue({ preset: "discreet" });
  const enabled = state !== "idle";

  return (
    <button aria-pressed={enabled} onClick={() => (enabled ? stop() : start())} type="button">
      Acoustic feedback
    </button>
  );
}
```
````

- [ ] **Step 3: API reference**

Append to `apps/docs/app/docs/api/page.mdx`:

````mdx
## React adapter

Available from `@puejs/react`. See [Framework Adapters](/docs/ecosystem#react) for usage.

### `usePue()`

```ts
function usePue<T extends Element = Element>(
  options?: EmitterOptions | false,
  config?: { autoStart?: boolean },
): {
  ref: (element: T | null) => void;
  state: EmitterState;
  start: () => Promise<void>;
  stop: () => void;
  emit: (input?: EmissionInput) => void;
  emitter: Emitter | null;
};
```

Options are compared by value: pitch ranges structurally, odor lists element by element, functions by identity — define custom tonnage curves outside the component. On the server and while disabled, `emitter` is `null`, `state` is `"idle"` and the methods are no-ops.

### `PueProvider`

| Prop           | Type             | Description                                                     |
| -------------- | ---------------- | --------------------------------------------------------------- |
| `defaults`     | `EmitterOptions` | Merged under the options of every `usePue` call in the subtree. |
| `audioContext` | `AudioContext`   | Shared by every emitter in the subtree. Never closed.           |
````

- [ ] **Step 4: Installation page and landing**

In `apps/docs/app/docs/installation/page.mdx`, add a row to the entry points table, after the `@puejs/core/odors` row:

```mdx
| `@puejs/react` | React adapter: `usePue`, `PueProvider` (separate package) | — |
```

In `apps/docs/components/landing/code-showcase.tsx`, replace the "Framework agnostic" highlight body with `"Bind to any scroll container, from the window to a single panel. Official React adapter, and plain lifecycle hooks everywhere else."`

- [ ] **Step 5: Verify**

Run: `npx prettier --write "apps/docs/**/*.{ts,tsx,mdx}" && yarn lint && yarn typecheck && yarn build`
Expected: green. Start `npx next start --port 3011` in `apps/docs`, open `/docs/ecosystem` and `/docs/api`, check the React sections render; stop the server.

- [ ] **Step 6: Commit**

```bash
git add apps/docs
git commit -m "docs: document the @puejs/react adapter"
```

---

## Final verification

- [ ] `yarn test && yarn lint && yarn typecheck && yarn build` from the root: green.
- [ ] Report: branch, commits, test counts; nothing pushed or published.
