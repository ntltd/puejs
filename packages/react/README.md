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
