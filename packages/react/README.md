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
- Options are compared by value; removing one reverts it to its default. Define custom tonnage curves, profiles and odor lists outside the component: built inline, they are re-applied on every render.
- Once `ref` has been attached, removing the element disables the emitter until a new element is attached.

## Provider

```tsx
import { PueProvider } from "@puejs/react";

<PueProvider defaults={{ preset: "organic", volume: 0.6 }}>{children}</PueProvider>;
```

`defaults` are merged under every `usePue()` in the subtree, and `audioContext` is shared (never closed by the adapter). Changing it recreates the emitters.

## License

Released into the public domain under the [Unlicense](./LICENSE).
