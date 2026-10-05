# @puejs/react — design

Date: 2026-10-05
Status: approved in conversation, pending written review

## Intent

Ship the React adapter announced by the docs, so that React applications bind an emitter to a component lifecycle in a few lines.

- Success: `usePue()` creates, updates and destroys the emitter with the component — including in Strict Mode and the Next.js App Router — and a button can turn acoustic feedback on and off.
- Audio never starts by itself: the hook exposes `start()` / `stop()` to wire to a user gesture ("consent first"). `autoStart` is available as an explicit opt-in.
- Scope: `usePue` and `PueProvider`. No ready-made toggle component.

## Decisions

| Topic            | Decision                                                                                     |
| ---------------- | -------------------------------------------------------------------------------------------- |
| Package          | `@puejs/react`, in `packages/react`, ESM only, `"sideEffects": false`, Unlicense             |
| Dependencies     | None. Peer dependencies: `react` `^18.0.0 \|\| ^19.0.0`, `@puejs/core` `^1.0.0`               |
| Emitter lifetime | One emitter per hook instance, created on mount, destroyed on unmount                        |
| Option changes   | Compared by value, applied with `emitter.update()` (never recreating the emitter)            |
| State            | Read through `useSyncExternalStore`, driven by the emitter's `statechange` event              |
| Client boundary  | The built bundle starts with `"use client"`                                                  |
| Build / tests    | tsdown; vitest + React Testing Library + happy-dom, with `@puejs/core` mocked                 |

## API

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

### `usePue<T extends Element = Element>(options?: EmitterOptions | false, config?: UsePueConfig): UsePueResult<T>`

`UsePueConfig`:

| Field       | Type      | Default | Description                                                |
| ----------- | --------- | ------- | ---------------------------------------------------------- |
| `autoStart` | `boolean` | `false` | Call `start()` once the emitter exists. Audio stays suspended until a user gesture (`autoUnlock`). |

`UsePueResult<T>`:

| Field     | Type                                   | Description                                                                                  |
| --------- | -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `ref`     | `(element: T \| null) => void`         | Ref callback for the scroll container. When it is never attached, the hook observes `window`. |
| `state`   | `EmitterState`                         | Reactive lifecycle state. `"idle"` before mount, on the server and when disabled.            |
| `start`   | `() => Promise<void>`                  | Starts the emitter. Call it from a user gesture. Resolves immediately when there is no emitter. |
| `stop`    | `() => void`                           | Stops the emitter. No-op when there is no emitter.                                           |
| `emit`    | `(input?: EmissionInput) => void`      | Manual emission. No-op when there is no emitter.                                             |
| `emitter` | `Emitter \| null`                      | The underlying emitter, for event subscriptions. `null` on the server and when disabled.      |

Behaviour:

- **Creation** happens in an effect, so never on the server. Target: the element passed to `ref`, otherwise `window`.
- **Target change**: attaching `ref` to a different element destroys the emitter and creates one on the new target. The previous `state` is not carried over (a new emitter starts `idle`, or starts again with `autoStart`).
- **`false`** destroys the emitter; passing options again creates a new one.
- **Option updates**: the effective options (provider defaults merged under the hook's options) are compared by value — primitives, `pitch` ranges, odor arrays by element identity, functions by identity. Only real changes call `emitter.update()`. Inline object literals therefore do not cause updates on every render.
- **Unmount** calls `destroy()`. Strict Mode's double mount/unmount is safe because `destroy()` is idempotent in the core.
- **Event handlers** registered by users on `emitter` are removed with the emitter when it is destroyed.

### `<PueProvider defaults? audioContext?>`

| Prop           | Type                          | Description                                                                        |
| -------------- | ----------------------------- | ---------------------------------------------------------------------------------- |
| `defaults`     | `EmitterOptions`              | Options merged under every `usePue` call in the subtree (hook options win).        |
| `audioContext` | `AudioContext`                | Shared context passed to every emitter in the subtree. Never closed by the adapter. |
| `children`     | `React.ReactNode`             |                                                                                    |

The provider is optional. Without it, each emitter owns a private context (closed on destroy, as in the core).

## Package

```
packages/react/
├── package.json        # @puejs/react, peer deps react + @puejs/core
├── tsdown.config.ts    # banner "use client"
├── vitest.config.ts    # happy-dom
├── tsconfig.json, eslint.config.js, README.md, LICENSE, .gitignore
├── src/
│   ├── index.ts        # usePue, PueProvider, types
│   ├── use-pue.ts      # the hook
│   ├── provider.tsx    # PueProvider + context
│   └── equal.ts        # value comparison of emitter options
└── test/
    ├── equal.test.ts
    ├── use-pue.test.tsx
    └── provider.test.tsx
```

- `@puejs/core` is a peer and dev dependency (workspace link); it is never bundled (`external`).
- Turbo builds `@puejs/core` before `@puejs/react` (`dependsOn: ["^build"]`, already in place).

## Testing

`@puejs/core` is mocked with `vi.mock`: `createEmitter` returns a fake emitter that records `start`, `stop`, `update`, `emit`, `destroy`, supports `on("statechange")` and lets tests drive state changes.

- `equal`: identical options, changed primitive, changed pitch range, odor arrays (same elements vs different), functions by identity, provider defaults merging.
- `usePue`:
  - creates one emitter on mount, on `window` when `ref` is unused, on the element otherwise;
  - re-renders with an equal inline options object do not call `update`; a real change calls it once;
  - `state` follows `statechange`; `start` / `stop` / `emit` delegate to the emitter;
  - `autoStart` calls `start()` once;
  - `false` destroys the emitter and resets `state` to `idle`; re-enabling creates a new one;
  - moving `ref` to another element destroys and recreates on the new target;
  - unmount destroys; Strict Mode leaves exactly one live emitter.
- `PueProvider`: defaults merged under hook options (hook wins); shared `audioContext` passed to `createEmitter`.

## Site and docs

- Ecosystem page: React section uses `@puejs/react`; the roadmap marks React as available.
- Accessibility page: the toggle example uses `usePue`.
- API reference: an "Adapters" section documenting `usePue` and `PueProvider`.
- Landing: the "Framework agnostic" highlight mentions the React adapter.
- Publishing `@puejs/react` follows the same manual flow as `@puejs/core` (user runs `npm publish` with 2FA).

## Out of scope

Toggle component, Vue / Svelte / Solid adapters, React Native, migrating the site's own global toggle store to the hook.
