# Pue JS library — design

Date: 2026-10-05
Status: approved in conversation, pending written review

## Intent

Build the real `puejs` library from two audio samples, so that the API described on puejs.org exists.

- Success: `npm install puejs`, a few lines of code, and scrolling triggers varied emissions (pitch and gain follow scroll velocity) — including on puejs.org itself.
- The library is publishable on npm under `puejs` (name verified available) **and** powers a live demo on the site.
- Scope: the core of the documented API. Reverberation, AudioWorklet synthesis and framework adapters are out of scope for v1.
- The site's documentation is updated so that it only describes what ships.

## Decisions

| Topic           | Decision                                                                                  |
| --------------- | ----------------------------------------------------------------------------------------- |
| Audio engine    | Web Audio API with pre-decoded `AudioBuffer`s (no `<audio>` elements, no AudioWorklet)     |
| Asset delivery  | Samples inlined as base64 data, one ES module per odor, tree-shakable                     |
| Odor names      | `staccato` = `fart-dry.mp3`, `sustained` = `fart-chubby.mp3`                               |
| Encoding        | `fart-dry.mp3` re-encoded to mono 22.05 kHz (like `fart-chubby.mp3`) to shrink it          |
| Dependencies    | None at runtime                                                                           |
| Build           | `tsdown` (ESM + `.d.ts`)                                                                  |
| Tests           | `vitest` with a fake `AudioContext`, fake scroll target and fake `requestAnimationFrame`  |
| Custom samples  | `defineOdor({ name, src, tonnage? })` included in v1                                      |
| Publishing      | Package prepared for npm; publishing only on explicit approval                            |

## 1. Package structure

Location: `packages/puejs`, published as `puejs`. ESM only, `"sideEffects": false`, zero runtime dependencies, Unlicense.

```
packages/puejs/
├── src/
│   ├── index.ts          # public entry: createEmitter, presets, defineOdor, isSupported, unlock, PueError, types
│   ├── emitter.ts        # emitter lifecycle (idle / suspended / running / destroyed)
│   ├── kinematics.ts     # scroll sampling + smoothed velocity (pure)
│   ├── tonnage.ts        # velocity → tonnage curves (pure)
│   ├── throttle.ts       # "velocity" / "distance" / fixed-interval strategies (pure)
│   ├── selection.ts      # odor selection by tonnage (pure)
│   ├── random.ts         # seeded PRNG (pure)
│   ├── options.ts        # option validation and preset merging (pure)
│   ├── playback.ts       # decoding cache + Web Audio voice graph
│   ├── presets.ts        # organic, crisp, deep, discreet
│   ├── odor.ts           # Odor type + defineOdor
│   ├── errors.ts         # PueError + codes
│   ├── types.ts          # public types
│   └── odors/
│       ├── index.ts      # `puejs/odors` entry
│       ├── staccato.ts   # generated: fart-dry, base64
│       └── sustained.ts  # generated: fart-chubby, base64
├── assets/               # source mp3 files (not published)
├── scripts/encode-odors.ts  # re-encodes assets and regenerates src/odors/*.ts
└── test/
```

Entry points (`exports`): `puejs` and `puejs/odors`. Built-in presets reference both odors, so `puejs` includes them; importing from `puejs/odors` alone only bundles the odors actually imported. Documented sizes are the measured ones.

Tooling: shared ESLint flat config, new `packages/tsconfig/library.json`, Turbo `build` (the site already depends on `^build`), `test` task added to Turbo.

`scripts/encode-odors.ts` runs `ffmpeg` to produce mono 22.05 kHz mp3 files and writes the base64 modules. Generated modules are committed so that building does not require `ffmpeg`.

## 2. Public API

```ts
import { createEmitter } from "puejs";

const emitter = createEmitter(window, { preset: "organic" });
await emitter.start(); // from a user gesture
```

### `createEmitter(target: Window | Element, options?: EmitterOptions): Emitter`

| Option                 | Type                                     | Default                  | Role                                                    |
| ---------------------- | ---------------------------------------- | ------------------------ | ------------------------------------------------------- |
| `preset`               | `PresetName \| AcousticProfile`          | `"organic"`              | Base profile; other options are merged over it          |
| `odors`                | `Odor[]`                                 | preset odors             | Samples available to the emitter                        |
| `pitch`                | `number \| { min: number; max: number }` | preset (`0.9`–`1.1`)     | Playback rate; a range is sampled per emission          |
| `resonance`            | `number` (0–1)                           | preset (`0.4`)           | Low-frequency body, via a peaking filter                |
| `duration`             | `number` (ms)                            | preset (`320`)           | Maximum emission length, ends with a fade-out           |
| `volume`               | `number` (0–1)                           | preset (`0.8`)           | Master gain                                             |
| `tonnage`              | `"linear" \| "logarithmic" \| "exponential" \| TonnageCurve` | `"logarithmic"` | Velocity → tonnage mapping                     |
| `threshold`            | `number` (px/s)                          | `80`                     | Minimum velocity to emit                                |
| `throttle`             | `"velocity" \| "distance" \| number`     | `"velocity"`             | Emission rate strategy, or fixed interval in ms         |
| `respectReducedMotion` | `boolean`                                | `true`                   | Silent when `prefers-reduced-motion: reduce`            |
| `autoUnlock`           | `boolean`                                | `true`                   | Resume a suspended context on the next user gesture     |
| `audioContext`         | `AudioContext`                           | private context          | Share a context between emitters                        |

### `Emitter`

- Properties: `state: "idle" | "suspended" | "running" | "destroyed"`, `context: AudioContext | null`, `options: Readonly<ResolvedOptions>`.
- Methods: `start(): Promise<void>`, `stop(): void`, `update(options: Partial<EmitterOptions>): void`, `emit(input?: { tonnage?: number; odor?: Odor }): void`, `on(event, handler): () => void`, `off(event, handler): void`, `destroy(): void`.
- Events:
  - `emit`: `{ tonnage, velocity, direction: 1 | -1, pitch, odor: string, latency, timestamp }`
  - `statechange`: `{ previous, current }`
  - `unlock`: `{ context }`
  - `error`: `PueError`

### Presets

| Preset     | Odors                | Pitch       | Resonance | Duration | Volume |
| ---------- | -------------------- | ----------- | --------- | -------- | ------ |
| `organic`  | staccato, sustained  | 0.90 – 1.10 | 0.40      | 320 ms   | 0.8    |
| `crisp`    | staccato             | 1.10 – 1.35 | 0.20      | 180 ms   | 0.8    |
| `deep`     | sustained            | 0.60 – 0.80 | 0.70      | 620 ms   | 0.8    |
| `discreet` | staccato             | 0.95 – 1.05 | 0.25      | 220 ms   | 0.4    |

Presets are exported as frozen objects (`presets.organic`, …) and can be spread into custom profiles.

### Odors

- `puejs/odors` exports `staccato` (tonnage range `[0, 0.6]`) and `sustained` (`[0.4, 1]`).
- `defineOdor({ name: string; src: string; tonnage?: [number, number] }): Odor` — `src` is a URL or a data URI, fetched and decoded on `start()`.

### Utilities and errors

- `isSupported(): boolean` — `AudioContext` available in a browser environment.
- `defineTonnageCurve(curve: (velocity: number) => number): TonnageCurve` — validates and returns a custom curve (already referenced by the docs).
- `unlock(context?: AudioContext): Promise<boolean>` — resume a context (or every context created by Pue JS) from a user gesture.
- `PueError` with `code`: `E_DESTROYED`, `E_INVALID_OPTION`, `E_DECODE`.

## 3. Runtime

### Lifecycle

- `createEmitter` validates and resolves options only. No audio resources, no listeners: safe during SSR and free while idle.
- `start()`: creates the private `AudioContext` if none was provided, decodes odors, attaches a passive scroll listener, resumes the context. If resuming is blocked, state becomes `suspended`; with `autoUnlock`, one-shot `pointerdown` / `keydown` / `touchend` listeners resume it, set `running` and dispatch `unlock`. Calling `start()` on a running emitter is a no-op.
- Decoded buffers are cached per `AudioContext` (`WeakMap`), so emitters sharing a context decode each odor once.
- `stop()`: removes listeners, lets active voices finish, state returns to `idle`.
- `destroy()`: removes listeners, stops voices, closes the private context, state `destroyed`.

### Per-frame pipeline

1. **Sampling** — the scroll event only marks the target dirty; position (`scrollY` / `scrollTop`) is read once per `requestAnimationFrame`. The loop stops after ~150 ms without movement.
2. **Velocity** — px/s from position delta over time delta, exponentially smoothed (time-constant based) to absorb trackpad jitter; direction is the sign.
3. **Gates** — no emission below `threshold`, when `document.hidden`, or when reduced motion is preferred and `respectReducedMotion` is on (the media query is observed live).
4. **Throttle** — `"velocity"`: minimum interval interpolated from 260 ms (tonnage 0) to 60 ms (tonnage 1); `"distance"`: one emission per half viewport height scrolled; `number`: fixed interval in ms.
5. **Tonnage** — velocity normalized over `[threshold, 3000]` px/s, then: linear `x`, logarithmic `log10(1 + 9x)`, exponential `x²`, or the custom curve (clamped to 0–1).
6. **Selection** — odors whose tonnage range contains the tonnage; when several qualify, a seeded random pick; when none, the odor with the closest range.
7. **Voice** — `AudioBufferSourceNode` (`playbackRate` = pitch) → `BiquadFilterNode` (peaking, ~180 Hz, gain `resonance × 12 dB`) → `GainNode` (`volume × (0.25 + 0.75 × tonnage)`, 60 ms linear fade-out ending at `duration`) → destination. Scheduled at `currentTime + 0.005`.
8. **Polyphony** — at most 6 concurrent voices; the oldest is stopped when the limit is reached. Nodes are disconnected on `ended`.
9. **Determinism** — pitch sampling and odor selection use a seeded PRNG (mulberry32, fixed seed per emitter). Identical scroll input produces identical output.
10. **Telemetry** — `emit` reports `latency` as the time between the frame that detected motion and scheduling.

### Errors

- Invalid option → `PueError(E_INVALID_OPTION)` thrown synchronously by `createEmitter` / `update`.
- Any call on a destroyed emitter → `PueError(E_DESTROYED)`, except `destroy()` (idempotent, safe for double cleanups) and `off()`.
- Undecodable odor → `error` event with `E_DECODE`; the odor is dropped and the emitter keeps running with the others.
- Unsupported environment or server → inert emitter with the same API, state stays `idle`, methods are no-ops, `start()` resolves.
- Exceptions thrown by event handlers are isolated (rethrown asynchronously) so they never break the scroll loop.

## 4. Testing, site integration, documentation

### Tests (vitest)

- Pure units: velocity and smoothing, tonnage curves, throttle strategies, odor selection, PRNG, option validation and preset merging.
- Emitter with a fake `AudioContext` (records sources, gains, filters and schedules), a fake scroll target and a controllable `requestAnimationFrame`:
  - state transitions, including `suspended` → `running` through `autoUnlock`;
  - scrolling above the threshold creates a voice with the expected pitch, gain and fade-out; below it, nothing;
  - throttle, 6-voice cap, reduced motion and hidden document gates;
  - `update`, manual `emit`, `destroy` then `E_DESTROYED`, `E_DECODE` on a corrupt sample;
  - determinism: two emitters fed the same scroll sequence produce the same emissions.
- Inert emitter when `AudioContext` is missing.

### puejs.org

- The site depends on the workspace package (`"puejs": "*"`).
- Navbar toggle "Acoustic feedback": off by default, `aria-pressed`, preference persisted. Its click is the unlocking gesture: the emitter is created and started on `window` with the `organic` preset.
- Hero sonar: each `emit` event triggers an extra ripple from the logo.

### Documentation and landing updates

- Remove: reverberation and rooms, AudioWorklet and `workletUrl`, framework adapters (Ecosystem page becomes a roadmap), `tremolo`, `infrasonic`, procedural synthesis claims.
- Update: real bundle sizes measured after the build, new `defineOdor` signature, Architecture pipeline (decoded samples), "no audio files shipped" becomes "audio assets inlined and tree-shakable", error codes.
- Landing: code showcase without `reverb`; displayed figures (bundle size, latency) aligned with measured values.

### Publishing

`exports`, `files`, `publishConfig`, README and license are prepared. `npm publish` only runs after explicit approval.

## Out of scope (v1)

Reverberation, AudioWorklet synthesis, framework adapters (`puejs/react`, `vue`, `svelte`, `solid`), horizontal scroll, olfactory output.
