# Pue JS library Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real `puejs` npm package (scroll-driven acoustic emissions from two inlined samples), wire it into puejs.org as a live demo, and align the site's documentation with what ships.

**Architecture:** A zero-dependency TypeScript package in `packages/puejs`. Pure modules (kinematics, tonnage, throttle, selection, PRNG, option resolution) feed an emitter that samples scroll once per animation frame and plays pre-decoded `AudioBuffer`s through a small Web Audio graph. All browser globals go through an injectable `Environment`, so the emitter is fully testable in Node with fakes.

**Tech Stack:** TypeScript 6, tsdown 0.23 (ESM + `.d.ts`), vitest 5, Web Audio API, ffmpeg (asset encoding only), Next.js 16 + Panda CSS 2 for the site.

**Spec:** `docs/superpowers/specs/2026-10-05-puejs-library-design.md`

## Global Constraints

- Package name `puejs`, version `1.0.0`, license Unlicense, ESM only, `"sideEffects": false`, **zero runtime dependencies**.
- Entry points: `puejs` and `puejs/odors` only.
- Odor names: `staccato` = `fart-dry.mp3` (tonnage `[0, 0.6]`), `sustained` = `fart-chubby.mp3` (tonnage `[0.4, 1]`).
- `fart-dry.mp3` re-encoded to mono, 22.05 kHz, 32 kbit/s. `fart-chubby.mp3` is copied as-is (already mono 22.05 kHz).
- Defaults: preset `organic`, threshold `80` px/s, throttle `"velocity"`, `respectReducedMotion: true`, `autoUnlock: true`, max velocity `3000` px/s, 6 voices, idle timeout `150` ms, schedule-ahead `0.005` s, fade-out `0.06` s, resonance filter peaking at `180` Hz with gain `resonance × 12` dB, gain `volume × (0.25 + 0.75 × tonnage)`.
- Error codes: `E_DESTROYED`, `E_INVALID_OPTION`, `E_DECODE`. `destroy()` and `off()` never throw.
- Never publish to npm and never push without an explicit request from the user. Work on branch `feat/puejs-library`; commit after each task.
- Site copy stays in English with the "100% corporate tech" tone; no jokes, no emoji.
- Commit messages: lowercase conventional commits, no attribution trailer.

## Review Focus

- **Scrolling stops with `threshold: 0`** — the smoothed velocity decays over ~150 ms after the last movement; no emission may fire on frames where the position did not change. Test in Task 6 ("does not emit on frames without movement").
- **`start()` called twice, or `stop()` called while `start()` is still decoding** — must not attach two scroll listeners nor leave a listener behind. Tests in Task 6.
- **React Strict Mode double cleanup** — `destroy()` twice and `off()` after destroy must not throw. Test in Task 6.
- **`update()` with an invalid value** — throws `E_INVALID_OPTION` and keeps the previous options intact. Test in Task 6.
- **Chrome keeps `AudioContext.resume()` pending until a gesture** — `start()` must not await `resume()`; it resolves in `suspended` state instead of hanging. Test in Task 6 (fake context whose `resume()` never resolves).

---

## File Structure

```
packages/puejs/
├── package.json, tsconfig.json, tsdown.config.ts, vitest.config.ts, eslint.config.js, README.md, LICENSE
├── assets/fart-dry.mp3, assets/fart-chubby.mp3        # sources, not published
├── scripts/encode-odors.ts                             # assets → src/odors/*.ts
├── scripts/size.ts                                     # prints gzip sizes
├── src/
│   ├── index.ts         # public entry
│   ├── errors.ts        # PueError, destroyedError
│   ├── random.ts        # seeded PRNG
│   ├── kinematics.ts    # smoothed velocity
│   ├── tonnage.ts       # velocity → tonnage, defineTonnageCurve
│   ├── throttle.ts      # emission rate strategies
│   ├── odor.ts          # Odor, defineOdor, isOdor
│   ├── selection.ts     # odor selection by tonnage
│   ├── types.ts         # public types
│   ├── presets.ts       # organic, crisp, deep, discreet
│   ├── options.ts       # validation + preset merging
│   ├── playback.ts      # decode cache + voice graph
│   ├── environment.ts   # Environment interface, browser implementation, isSupported
│   ├── emitter.ts       # emitter lifecycle + per-frame pipeline
│   ├── inert.ts         # no-op emitter for unsupported environments
│   └── odors/index.ts, staccato.ts, sustained.ts   # generated
└── test/
    ├── fakes.ts
    └── *.test.ts
packages/tsconfig/library.json                          # new shared config
packages/eslint-config-custom/library.js                # new shared lint config
apps/docs/components/site/acoustic-feedback.ts          # client-side emitter store
apps/docs/components/site/acoustic-toggle.tsx           # navbar toggle
apps/docs/components/landing/emission-ripples.tsx       # hero ripples on emit
```

---

### Task 1: Package scaffold, errors and seeded PRNG

**Files:**
- Create: `packages/puejs/package.json`, `packages/puejs/tsconfig.json`, `packages/puejs/tsdown.config.ts`, `packages/puejs/vitest.config.ts`, `packages/puejs/eslint.config.js`, `packages/puejs/LICENSE`
- Create: `packages/tsconfig/library.json`, `packages/eslint-config-custom/library.js`
- Modify: `packages/eslint-config-custom/package.json`, `turbo.json`, `package.json` (root)
- Create: `packages/puejs/src/errors.ts`, `packages/puejs/src/random.ts`
- Test: `packages/puejs/test/errors.test.ts`, `packages/puejs/test/random.test.ts`

**Interfaces:**
- Produces: `class PueError extends Error { readonly code: PueErrorCode }`, `type PueErrorCode = "E_DESTROYED" | "E_INVALID_OPTION" | "E_DECODE"`, `destroyedError(): PueError`, `type Random = () => number`, `createRandom(seed?: number): Random`, `DEFAULT_SEED`.

- [ ] **Step 1: Create the branch and commit the spec and this plan**

```bash
git checkout -b feat/puejs-library
git add docs/superpowers
git commit -m "docs: add puejs library spec and plan"
```

- [ ] **Step 2: Add the shared library configs**

`packages/tsconfig/library.json`:

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Library",
  "extends": "./base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "noEmit": true,
    "types": ["node"]
  }
}
```

`packages/eslint-config-custom/library.js`:

```js
import turbo from "eslint-config-turbo/flat";
import tseslint from "typescript-eslint";

/*
 * Shared ESLint flat config for framework-agnostic TypeScript libraries.
 */
export default [
  ...tseslint.configs.recommended,
  ...turbo,
  {
    ignores: ["node_modules/", "dist/"],
  },
];
```

In `packages/eslint-config-custom/package.json`, add the export and the dependency:

```json
  "exports": {
    "./next": "./next.js",
    "./library": "./library.js"
  },
  "dependencies": {
    "eslint-config-next": "^16.3.8",
    "eslint-config-turbo": "^2.11.7",
    "typescript-eslint": "^8.71.0"
  },
```

Update `packages/eslint-config-custom/README.md` to list both configs:

```md
# `eslint-config-custom`

Shared ESLint flat configs.

- `eslint-config-custom/next`: Next.js (core-web-vitals + TypeScript) and Turborepo rules.
- `eslint-config-custom/library`: TypeScript and Turborepo rules for framework-agnostic packages.
```

- [ ] **Step 3: Create the package files**

`packages/puejs/package.json`:

```json
{
  "name": "puejs",
  "version": "1.0.0",
  "description": "Next-generation acoustic feedback for modern web applications.",
  "license": "Unlicense",
  "homepage": "https://www.puejs.org",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/ntltd/puejs.git",
    "directory": "packages/puejs"
  },
  "keywords": ["scroll", "audio", "web-audio", "feedback", "acoustic"],
  "type": "module",
  "sideEffects": false,
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./odors": {
      "types": "./dist/odors/index.d.ts",
      "default": "./dist/odors/index.js"
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
    "encode-odors": "node scripts/encode-odors.ts",
    "size": "node scripts/size.ts"
  },
  "devDependencies": {
    "@types/node": "^24.19.1",
    "eslint": "^9.39.5",
    "eslint-config-custom": "*",
    "tsconfig": "*",
    "tsdown": "^0.23.0",
    "typescript": "^6.0.3",
    "vitest": "^5.0.3"
  }
}
```

`packages/puejs/tsconfig.json`:

```json
{
  "extends": "tsconfig/library.json",
  "include": ["src", "test", "scripts", "tsdown.config.ts", "vitest.config.ts"]
}
```

`packages/puejs/tsdown.config.ts`:

```ts
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", "odors/index": "src/odors/index.ts" },
  format: "esm",
  dts: true,
  platform: "neutral",
  target: "es2020",
  clean: true,
});
```

`packages/puejs/vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["test/**/*.test.ts"],
  },
});
```

`packages/puejs/eslint.config.js`:

```js
import library from "eslint-config-custom/library";

export default library;
```

Copy the license: `cp LICENSE packages/puejs/LICENSE`.

- [ ] **Step 4: Register the test task in Turbo and the root**

In `turbo.json`, replace the `typecheck` and `dev` tasks and add `test`, so that the site always builds against a compiled library:

```json
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {},
    "dev": {
      "dependsOn": ["^build"],
      "cache": false,
      "persistent": true
    }
```

In the root `package.json` scripts, add `"test": "turbo run test",` after `"lint"`.

Run: `yarn install`
Expected: `success Saved lockfile.`

- [ ] **Step 5: Write the failing tests**

`packages/puejs/test/errors.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PueError, destroyedError } from "../src/errors";

describe("PueError", () => {
  it("carries a stable code and name", () => {
    const error = new PueError("E_INVALID_OPTION", "Invalid option.");
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe("PueError");
    expect(error.code).toBe("E_INVALID_OPTION");
    expect(error.message).toBe("Invalid option.");
  });

  it("keeps the cause", () => {
    const cause = new Error("decode failed");
    expect(new PueError("E_DECODE", "Could not decode.", { cause }).cause).toBe(cause);
  });

  it("builds the destroyed error", () => {
    expect(destroyedError().code).toBe("E_DESTROYED");
  });
});
```

`packages/puejs/test/random.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createRandom } from "../src/random";

const take = (random: () => number, count: number): number[] => Array.from({ length: count }, () => random());

describe("createRandom", () => {
  it("is deterministic for a given seed", () => {
    expect(take(createRandom(42), 5)).toEqual(take(createRandom(42), 5));
  });

  it("differs between seeds", () => {
    expect(take(createRandom(1), 5)).not.toEqual(take(createRandom(2), 5));
  });

  it("returns values in [0, 1)", () => {
    for (const value of take(createRandom(), 1000)) {
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });
});
```

- [ ] **Step 6: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — `Failed to resolve import "../src/errors"`.

- [ ] **Step 7: Implement**

`packages/puejs/src/errors.ts`:

```ts
export type PueErrorCode = "E_DESTROYED" | "E_INVALID_OPTION" | "E_DECODE";

/** Every error thrown or dispatched by Pue JS. */
export class PueError extends Error {
  readonly code: PueErrorCode;

  constructor(code: PueErrorCode, message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "PueError";
    this.code = code;
  }
}

export const destroyedError = (): PueError => new PueError("E_DESTROYED", "This emitter has been destroyed.");
```

`packages/puejs/src/random.ts`:

```ts
export type Random = () => number;

export const DEFAULT_SEED = 0x9e3779b9;

/** Seeded mulberry32 generator: identical seeds produce identical sequences. */
export function createRandom(seed: number = DEFAULT_SEED): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `yarn workspace puejs test`
Expected: PASS (6 tests).

Run: `yarn workspace puejs lint && yarn workspace puejs typecheck`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add packages/puejs packages/tsconfig/library.json packages/eslint-config-custom turbo.json package.json yarn.lock
git commit -m "feat(puejs): scaffold package with errors and seeded random"
```

---

### Task 2: Kinematics, tonnage and throttle

**Files:**
- Create: `packages/puejs/src/types.ts` (partial, completed in Task 4), `packages/puejs/src/kinematics.ts`, `packages/puejs/src/tonnage.ts`, `packages/puejs/src/throttle.ts`
- Test: `packages/puejs/test/kinematics.test.ts`, `packages/puejs/test/tonnage.test.ts`, `packages/puejs/test/throttle.test.ts`

**Interfaces:**
- Consumes: `PueError` (Task 1).
- Produces:
  - `interface KinematicsState { readonly position: number; readonly time: number; readonly velocity: number }` (velocity signed, px/s), `createKinematics(position, time): KinematicsState`, `updateKinematics(state, position, time, smoothing?: number): KinematicsState`, `SMOOTHING = 50`.
  - `MAX_VELOCITY = 3000`, `computeTonnage(velocity: number, threshold: number, curve: TonnageCurveName | TonnageCurve): number`, `defineTonnageCurve(curve): TonnageCurve`.
  - `interface ThrottleState { readonly lastTime: number; readonly lastPosition: number }`, `canEmit(strategy: ThrottleStrategy, state: ThrottleState, frame: { time: number; position: number; tonnage: number; viewportHeight: number }): boolean`.
  - In `types.ts`: `TonnageCurveName`, `TonnageCurve`, `ThrottleStrategy`.

- [ ] **Step 1: Write the failing tests**

`packages/puejs/test/kinematics.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createKinematics, updateKinematics } from "../src/kinematics";

describe("kinematics", () => {
  it("starts at rest", () => {
    expect(createKinematics(120, 0)).toEqual({ position: 120, time: 0, velocity: 0 });
  });

  it("converges to a constant scroll speed in px/s", () => {
    let state = createKinematics(0, 0);
    for (let frame = 1; frame <= 30; frame++) state = updateKinematics(state, frame * 16, frame * 16);
    expect(state.velocity).toBeGreaterThan(990);
    expect(state.velocity).toBeLessThan(1010);
  });

  it("smooths a single jump", () => {
    const state = updateKinematics(createKinematics(0, 0), 16, 16);
    expect(state.velocity).toBeCloseTo(1000 * (1 - Math.exp(-16 / 50)), 5);
  });

  it("is signed by direction", () => {
    const state = updateKinematics(createKinematics(500, 0), 484, 16);
    expect(state.velocity).toBeLessThan(0);
  });

  it("ignores non-increasing timestamps", () => {
    const start = createKinematics(0, 100);
    expect(updateKinematics(start, 50, 100)).toBe(start);
    expect(updateKinematics(start, 50, 90)).toBe(start);
  });
});
```

`packages/puejs/test/tonnage.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PueError } from "../src/errors";
import { MAX_VELOCITY, computeTonnage, defineTonnageCurve } from "../src/tonnage";

describe("computeTonnage", () => {
  it("is 0 at or below the threshold and 1 at or above the maximum", () => {
    for (const curve of ["linear", "logarithmic", "exponential"] as const) {
      expect(computeTonnage(80, 80, curve)).toBe(0);
      expect(computeTonnage(10, 80, curve)).toBe(0);
      expect(computeTonnage(MAX_VELOCITY, 80, curve)).toBe(1);
      expect(computeTonnage(MAX_VELOCITY * 2, 80, curve)).toBe(1);
    }
  });

  it("applies the named curves", () => {
    expect(computeTonnage(1500, 0, "linear")).toBeCloseTo(0.5, 5);
    expect(computeTonnage(1500, 0, "logarithmic")).toBeCloseTo(Math.log10(5.5), 5);
    expect(computeTonnage(1500, 0, "exponential")).toBeCloseTo(0.25, 5);
  });

  it("clamps custom curves to [0, 1]", () => {
    expect(computeTonnage(500, 80, () => 2)).toBe(1);
    expect(computeTonnage(500, 80, () => -1)).toBe(0);
    expect(computeTonnage(500, 80, () => Number.NaN)).toBe(0);
    expect(computeTonnage(500, 80, (velocity) => velocity / 1000)).toBe(0.5);
  });
});

describe("defineTonnageCurve", () => {
  it("returns the curve", () => {
    const curve = (velocity: number) => velocity / 3000;
    expect(defineTonnageCurve(curve)).toBe(curve);
  });

  it("rejects non-functions", () => {
    expect(() => defineTonnageCurve("fast" as never)).toThrow(PueError);
  });
});
```

`packages/puejs/test/throttle.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { canEmit } from "../src/throttle";

const frame = { time: 0, position: 0, tonnage: 0, viewportHeight: 800 };

describe("canEmit", () => {
  it("always allows the first emission", () => {
    expect(canEmit("velocity", { lastTime: Number.NEGATIVE_INFINITY, lastPosition: 0 }, frame)).toBe(true);
  });

  it("shortens the interval with tonnage for the velocity strategy", () => {
    const state = { lastTime: 0, lastPosition: 0 };
    expect(canEmit("velocity", state, { ...frame, time: 259, tonnage: 0 })).toBe(false);
    expect(canEmit("velocity", state, { ...frame, time: 260, tonnage: 0 })).toBe(true);
    expect(canEmit("velocity", state, { ...frame, time: 59, tonnage: 1 })).toBe(false);
    expect(canEmit("velocity", state, { ...frame, time: 60, tonnage: 1 })).toBe(true);
  });

  it("uses a fixed interval for numbers", () => {
    const state = { lastTime: 1000, lastPosition: 0 };
    expect(canEmit(100, state, { ...frame, time: 1099 })).toBe(false);
    expect(canEmit(100, state, { ...frame, time: 1100 })).toBe(true);
  });

  it("emits every half viewport for the distance strategy", () => {
    const state = { lastTime: 0, lastPosition: 1000 };
    expect(canEmit("distance", state, { ...frame, position: 1399 })).toBe(false);
    expect(canEmit("distance", state, { ...frame, position: 1400 })).toBe(true);
    expect(canEmit("distance", state, { ...frame, position: 600 })).toBe(true);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — unresolved imports `../src/kinematics`, `../src/tonnage`, `../src/throttle`.

- [ ] **Step 3: Implement**

`packages/puejs/src/types.ts` (first part; Task 4 appends the rest):

```ts
export type TonnageCurveName = "linear" | "logarithmic" | "exponential";

/** Maps a smoothed scroll velocity, in px/s, to a tonnage between 0 and 1. */
export type TonnageCurve = (velocity: number) => number;

export type ThrottleStrategy = "velocity" | "distance" | number;
```

`packages/puejs/src/kinematics.ts`:

```ts
export interface KinematicsState {
  readonly position: number;
  readonly time: number;
  /** Signed, smoothed velocity in px/s. */
  readonly velocity: number;
}

/** Time constant of the low-pass filter applied to velocity, in milliseconds. */
export const SMOOTHING = 50;

export const createKinematics = (position: number, time: number): KinematicsState => ({ position, time, velocity: 0 });

/** Derives the instantaneous velocity and smooths it to absorb trackpad jitter. */
export function updateKinematics(
  state: KinematicsState,
  position: number,
  time: number,
  smoothing: number = SMOOTHING,
): KinematicsState {
  const elapsed = time - state.time;
  if (elapsed <= 0) return state;
  const instant = ((position - state.position) / elapsed) * 1000;
  const alpha = 1 - Math.exp(-elapsed / smoothing);
  return { position, time, velocity: state.velocity + (instant - state.velocity) * alpha };
}
```

`packages/puejs/src/tonnage.ts`:

```ts
import { PueError } from "./errors";
import type { TonnageCurve, TonnageCurveName } from "./types";

/** Velocity, in px/s, at which tonnage saturates. */
export const MAX_VELOCITY = 3000;

const clamp01 = (value: number): number => (Number.isNaN(value) ? 0 : Math.min(1, Math.max(0, value)));

export function computeTonnage(
  velocity: number,
  threshold: number,
  curve: TonnageCurveName | TonnageCurve,
): number {
  if (typeof curve === "function") return clamp01(curve(velocity));
  const x = clamp01((velocity - threshold) / (MAX_VELOCITY - threshold));
  switch (curve) {
    case "linear":
      return x;
    case "exponential":
      return x * x;
    case "logarithmic":
      return Math.log10(1 + 9 * x);
  }
}

/** Declares a custom mapping from velocity to tonnage. */
export function defineTonnageCurve(curve: TonnageCurve): TonnageCurve {
  if (typeof curve !== "function") {
    throw new PueError("E_INVALID_OPTION", "A tonnage curve must be a function of the velocity.");
  }
  return curve;
}
```

`packages/puejs/src/throttle.ts`:

```ts
import type { ThrottleStrategy } from "./types";

export interface ThrottleState {
  readonly lastTime: number;
  readonly lastPosition: number;
}

export interface ThrottleFrame {
  time: number;
  position: number;
  tonnage: number;
  viewportHeight: number;
}

/** Minimum interval of the velocity strategy: 260 ms at tonnage 0, down to 60 ms at tonnage 1. */
const velocityInterval = (tonnage: number): number => 260 - 200 * tonnage;

export function canEmit(strategy: ThrottleStrategy, state: ThrottleState, frame: ThrottleFrame): boolean {
  if (strategy === "distance") return Math.abs(frame.position - state.lastPosition) >= frame.viewportHeight * 0.5;
  const interval = strategy === "velocity" ? velocityInterval(frame.tonnage) : strategy;
  return frame.time - state.lastTime >= interval;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn workspace puejs test`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add packages/puejs
git commit -m "feat(puejs): add kinematics, tonnage curves and throttle strategies"
```

---

### Task 3: Odors, selection, encoded samples and presets

**Files:**
- Create: `packages/puejs/src/odor.ts`, `packages/puejs/src/selection.ts`, `packages/puejs/src/presets.ts`
- Create: `packages/puejs/assets/fart-dry.mp3`, `packages/puejs/assets/fart-chubby.mp3`, `packages/puejs/scripts/encode-odors.ts`
- Generate: `packages/puejs/src/odors/staccato.ts`, `packages/puejs/src/odors/sustained.ts`
- Create: `packages/puejs/src/odors/index.ts`
- Modify: `packages/puejs/src/types.ts`
- Test: `packages/puejs/test/odor.test.ts`, `packages/puejs/test/selection.test.ts`, `packages/puejs/test/presets.test.ts`

**Interfaces:**
- Consumes: `PueError` (Task 1), `Random` (Task 1), `TonnageCurve`, `TonnageCurveName` (Task 2).
- Produces:
  - `interface Odor { readonly name: string; readonly src: string; readonly tonnage: readonly [number, number] }`, `interface OdorDefinition { name: string; src: string; tonnage?: readonly [number, number] }`, `defineOdor(definition: OdorDefinition): Odor`, `isOdor(value: unknown): value is Odor`.
  - `selectOdor(odors: readonly Odor[], tonnage: number, random: Random): Odor | undefined`.
  - `staccato: Odor`, `sustained: Odor` from `src/odors`.
  - In `types.ts`: `PresetName`, `PitchRange`, `AcousticProfile`.
  - `presets: Readonly<Record<PresetName, AcousticProfile>>`.

- [ ] **Step 1: Write the failing tests**

`packages/puejs/test/odor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PueError } from "../src/errors";
import { defineOdor, isOdor } from "../src/odor";

describe("defineOdor", () => {
  it("returns a frozen odor with a full tonnage range by default", () => {
    const odor = defineOdor({ name: "custom", src: "/sounds/custom.mp3" });
    expect(odor).toEqual({ name: "custom", src: "/sounds/custom.mp3", tonnage: [0, 1] });
    expect(Object.isFrozen(odor)).toBe(true);
    expect(Object.isFrozen(odor.tonnage)).toBe(true);
  });

  it.each([
    [{ name: "", src: "/a.mp3" }],
    [{ name: "a", src: "" }],
    [{ name: "a", src: "/a.mp3", tonnage: [0.8, 0.2] }],
    [{ name: "a", src: "/a.mp3", tonnage: [-0.1, 1] }],
    [{ name: "a", src: "/a.mp3", tonnage: [0, 1.5] }],
  ])("rejects %j", (definition) => {
    expect(() => defineOdor(definition as never)).toThrow(PueError);
  });
});

describe("isOdor", () => {
  it("recognizes odors", () => {
    expect(isOdor(defineOdor({ name: "a", src: "/a.mp3" }))).toBe(true);
    expect(isOdor({ name: "a" })).toBe(false);
    expect(isOdor(null)).toBe(false);
  });
});
```

`packages/puejs/test/selection.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defineOdor } from "../src/odor";
import { selectOdor } from "../src/selection";

const low = defineOdor({ name: "low", src: "/low.mp3", tonnage: [0, 0.6] });
const high = defineOdor({ name: "high", src: "/high.mp3", tonnage: [0.4, 1] });
const top = defineOdor({ name: "top", src: "/top.mp3", tonnage: [0.8, 1] });

describe("selectOdor", () => {
  it("picks the odor whose range contains the tonnage", () => {
    expect(selectOdor([low, high], 0.2, () => 0)).toBe(low);
    expect(selectOdor([low, high], 0.9, () => 0)).toBe(high);
  });

  it("uses the random source when ranges overlap", () => {
    expect(selectOdor([low, high], 0.5, () => 0)).toBe(low);
    expect(selectOdor([low, high], 0.5, () => 0.99)).toBe(high);
  });

  it("falls back to the closest range", () => {
    expect(selectOdor([top], 0.1, () => 0)).toBe(top);
    expect(selectOdor([low, top], 0.7, () => 0)).toBe(low);
  });

  it("returns undefined without odors", () => {
    expect(selectOdor([], 0.5, () => 0)).toBeUndefined();
  });
});
```

`packages/puejs/test/presets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { sustained, staccato } from "../src/odors";
import { presets } from "../src/presets";

describe("odors", () => {
  it("ship as inline mp3 data with their tonnage ranges", () => {
    expect(staccato.name).toBe("staccato");
    expect(staccato.tonnage).toEqual([0, 0.6]);
    expect(sustained.name).toBe("sustained");
    expect(sustained.tonnage).toEqual([0.4, 1]);
    for (const odor of [staccato, sustained]) expect(odor.src.startsWith("data:audio/mpeg;base64,")).toBe(true);
  });
});

describe("presets", () => {
  it("are frozen", () => {
    expect(Object.isFrozen(presets)).toBe(true);
    for (const profile of Object.values(presets)) {
      expect(Object.isFrozen(profile)).toBe(true);
      expect(Object.isFrozen(profile.odors)).toBe(true);
    }
  });

  it("match the documented profiles", () => {
    expect(presets.organic).toMatchObject({ pitch: { min: 0.9, max: 1.1 }, resonance: 0.4, duration: 320, volume: 0.8 });
    expect(presets.crisp).toMatchObject({ pitch: { min: 1.1, max: 1.35 }, resonance: 0.2, duration: 180, volume: 0.8 });
    expect(presets.deep).toMatchObject({ pitch: { min: 0.6, max: 0.8 }, resonance: 0.7, duration: 620, volume: 0.8 });
    expect(presets.discreet).toMatchObject({ pitch: { min: 0.95, max: 1.05 }, resonance: 0.25, duration: 220, volume: 0.4 });
    expect(presets.organic.odors).toEqual([staccato, sustained]);
    expect(presets.crisp.odors).toEqual([staccato]);
    expect(presets.deep.odors).toEqual([sustained]);
    expect(presets.discreet.odors).toEqual([staccato]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — unresolved `../src/odor`, `../src/selection`, `../src/odors`, `../src/presets`.

- [ ] **Step 3: Implement odors and selection**

`packages/puejs/src/odor.ts`:

```ts
import { PueError } from "./errors";

/** A sample the emitter can play. Built-in odors inline their audio as a data URI. */
export interface Odor {
  readonly name: string;
  /** URL or data URI of an audio file the browser can decode. */
  readonly src: string;
  /** Tonnage range for which the odor is eligible. */
  readonly tonnage: readonly [number, number];
}

export interface OdorDefinition {
  name: string;
  src: string;
  tonnage?: readonly [number, number];
}

function invalid(message: string): never {
  throw new PueError("E_INVALID_OPTION", message);
}

/** Declares an odor from a sample URL or data URI. */
export function defineOdor(definition: OdorDefinition): Odor {
  const { name, src, tonnage = [0, 1] } = definition;
  if (typeof name !== "string" || name.length === 0) invalid('An odor needs a non-empty "name".');
  if (typeof src !== "string" || src.length === 0) invalid(`The odor "${name}" needs a non-empty "src".`);
  const [min, max] = tonnage;
  if (!(Number.isFinite(min) && Number.isFinite(max) && min >= 0 && max <= 1 && min <= max)) {
    invalid(`The odor "${name}" needs a "tonnage" range with 0 <= min <= max <= 1.`);
  }
  return Object.freeze({ name, src, tonnage: Object.freeze([min, max] as const) });
}

export function isOdor(value: unknown): value is Odor {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.name === "string" &&
    typeof candidate.src === "string" &&
    Array.isArray(candidate.tonnage) &&
    candidate.tonnage.length === 2
  );
}
```

`packages/puejs/src/selection.ts`:

```ts
import type { Odor } from "./odor";
import type { Random } from "./random";

const distanceToRange = (odor: Odor, tonnage: number): number => {
  const [min, max] = odor.tonnage;
  if (tonnage < min) return min - tonnage;
  if (tonnage > max) return tonnage - max;
  return 0;
};

/** Picks an odor eligible for the tonnage; overlapping candidates are drawn from the seeded random source. */
export function selectOdor(odors: readonly Odor[], tonnage: number, random: Random): Odor | undefined {
  if (odors.length === 0) return undefined;
  const eligible = odors.filter((odor) => distanceToRange(odor, tonnage) === 0);
  if (eligible.length > 0) return eligible[Math.floor(random() * eligible.length)];
  return odors.reduce((closest, odor) =>
    distanceToRange(odor, tonnage) < distanceToRange(closest, tonnage) ? odor : closest,
  );
}
```

- [ ] **Step 4: Add the samples and the encoding script**

```bash
mkdir -p packages/puejs/assets packages/puejs/scripts packages/puejs/src/odors
cp ~/Desktop/fart-dry.mp3 ~/Desktop/fart-chubby.mp3 packages/puejs/assets/
```

`packages/puejs/scripts/encode-odors.ts`:

```ts
// Regenerates src/odors/*.ts from assets/. Requires ffmpeg for odors that are re-encoded.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const odors = [
  // Re-encoded to mono 22.05 kHz to match fart-chubby.mp3 and shrink the inlined payload.
  { name: "staccato", source: "fart-dry.mp3", tonnage: [0, 0.6], reencode: true },
  { name: "sustained", source: "fart-chubby.mp3", tonnage: [0.4, 1], reencode: false },
];

const work = mkdtempSync(join(tmpdir(), "puejs-odors-"));
try {
  for (const odor of odors) {
    const input = join(root, "assets", odor.source);
    let file = input;
    if (odor.reencode) {
      file = join(work, `${odor.name}.mp3`);
      execFileSync("ffmpeg", [
        "-v", "error", "-i", input, "-ac", "1", "-ar", "22050", "-b:a", "32k", "-map_metadata", "-1", "-y", file,
      ]);
    }
    const bytes = readFileSync(file);
    const source = [
      `// Generated by scripts/encode-odors.ts from assets/${odor.source}. Do not edit.`,
      `import { defineOdor } from "../odor";`,
      ``,
      `export const ${odor.name} = /* @__PURE__ */ defineOdor({`,
      `  name: "${odor.name}",`,
      `  src: "data:audio/mpeg;base64,${bytes.toString("base64")}",`,
      `  tonnage: [${odor.tonnage.join(", ")}],`,
      `});`,
      ``,
    ].join("\n");
    writeFileSync(join(root, "src", "odors", `${odor.name}.ts`), source);
    console.log(`${odor.name}: ${bytes.length} bytes`);
  }
} finally {
  rmSync(work, { recursive: true, force: true });
}
```

Run: `yarn workspace puejs encode-odors`
Expected: `staccato: 1794 bytes` (± a few bytes) and `sustained: 1690 bytes`.

`packages/puejs/src/odors/index.ts`:

```ts
export { staccato } from "./staccato";
export { sustained } from "./sustained";
```

Add `packages/puejs/src/odors/staccato.ts` and `sustained.ts` to the root `.prettierignore` (create it) so the generated base64 lines are never reformatted:

```
packages/puejs/src/odors/staccato.ts
packages/puejs/src/odors/sustained.ts
```

- [ ] **Step 5: Implement the presets**

Append to `packages/puejs/src/types.ts`:

```ts
import type { Odor } from "./odor";

export type { Odor };

export type PresetName = "organic" | "crisp" | "deep" | "discreet";

export interface PitchRange {
  readonly min: number;
  readonly max: number;
}

/** The full set of parameters that shape an emission. */
export interface AcousticProfile {
  readonly odors: readonly Odor[];
  readonly pitch: number | PitchRange;
  readonly resonance: number;
  readonly duration: number;
  readonly volume: number;
  readonly tonnage: TonnageCurveName | TonnageCurve;
}
```

Move the `import type { Odor } from "./odor";` line to the top of `types.ts` (imports first).

`packages/puejs/src/presets.ts`:

```ts
import { staccato } from "./odors/staccato";
import { sustained } from "./odors/sustained";
import type { AcousticProfile, PresetName } from "./types";

const profile = (definition: AcousticProfile): AcousticProfile =>
  Object.freeze({
    ...definition,
    odors: Object.freeze([...definition.odors]),
    pitch: typeof definition.pitch === "number" ? definition.pitch : Object.freeze({ ...definition.pitch }),
  });

export const presets: Readonly<Record<PresetName, AcousticProfile>> = Object.freeze({
  organic: profile({
    odors: [staccato, sustained],
    pitch: { min: 0.9, max: 1.1 },
    resonance: 0.4,
    duration: 320,
    volume: 0.8,
    tonnage: "logarithmic",
  }),
  crisp: profile({
    odors: [staccato],
    pitch: { min: 1.1, max: 1.35 },
    resonance: 0.2,
    duration: 180,
    volume: 0.8,
    tonnage: "logarithmic",
  }),
  deep: profile({
    odors: [sustained],
    pitch: { min: 0.6, max: 0.8 },
    resonance: 0.7,
    duration: 620,
    volume: 0.8,
    tonnage: "logarithmic",
  }),
  discreet: profile({
    odors: [staccato],
    pitch: { min: 0.95, max: 1.05 },
    resonance: 0.25,
    duration: 220,
    volume: 0.4,
    tonnage: "logarithmic",
  }),
});
```

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn workspace puejs test && yarn workspace puejs lint && yarn workspace puejs typecheck`
Expected: PASS, no lint or type errors.

- [ ] **Step 7: Commit**

```bash
git add packages/puejs .prettierignore
git commit -m "feat(puejs): add odors, selection, encoded samples and presets"
```

---

### Task 4: Public types and option resolution

**Files:**
- Modify: `packages/puejs/src/types.ts`
- Create: `packages/puejs/src/options.ts`
- Test: `packages/puejs/test/options.test.ts`

**Interfaces:**
- Consumes: `presets` (Task 3), `isOdor` (Task 3), `MAX_VELOCITY` (Task 2), `PueError` (Task 1).
- Produces (in `types.ts`): `EmitterState`, `EmitterOptions`, `ResolvedOptions`, `EmissionInput`, `EmissionEvent`, `EmitterEvents`, `EmitterEventHandler<E>`, `Emitter`.
- Produces (in `options.ts`): `DEFAULT_THRESHOLD = 80`, `resolveOptions(options?: EmitterOptions): ResolvedOptions`, `assertOptionsObject(value: unknown): asserts value is EmitterOptions`.

- [ ] **Step 1: Complete the public types**

Append to `packages/puejs/src/types.ts` (and add `import type { PueError } from "./errors";` with the other imports at the top):

```ts
export type EmitterState = "idle" | "suspended" | "running" | "destroyed";

export interface EmitterOptions {
  preset?: PresetName | AcousticProfile;
  odors?: readonly Odor[];
  pitch?: number | PitchRange;
  resonance?: number;
  duration?: number;
  volume?: number;
  tonnage?: TonnageCurveName | TonnageCurve;
  threshold?: number;
  throttle?: ThrottleStrategy;
  respectReducedMotion?: boolean;
  autoUnlock?: boolean;
  audioContext?: AudioContext;
}

/** Options after preset merging and defaults. */
export interface ResolvedOptions {
  readonly odors: readonly Odor[];
  readonly pitch: PitchRange;
  readonly resonance: number;
  readonly duration: number;
  readonly volume: number;
  readonly tonnage: TonnageCurveName | TonnageCurve;
  readonly threshold: number;
  readonly throttle: ThrottleStrategy;
  readonly respectReducedMotion: boolean;
  readonly autoUnlock: boolean;
  readonly audioContext: AudioContext | undefined;
}

export interface EmissionInput {
  tonnage?: number;
  odor?: Odor;
}

export interface EmissionEvent {
  tonnage: number;
  velocity: number;
  direction: 1 | -1;
  pitch: number;
  odor: string;
  latency: number;
  timestamp: number;
}

export interface EmitterEvents {
  emit: EmissionEvent;
  statechange: { previous: EmitterState; current: EmitterState };
  unlock: { context: AudioContext };
  error: PueError;
}

export type EmitterEventHandler<E extends keyof EmitterEvents> = (payload: EmitterEvents[E]) => void;

export interface Emitter {
  readonly state: EmitterState;
  readonly context: AudioContext | null;
  readonly options: ResolvedOptions;
  start(): Promise<void>;
  stop(): void;
  update(options: Partial<EmitterOptions>): void;
  emit(input?: EmissionInput): void;
  on<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>): () => void;
  off<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>): void;
  destroy(): void;
}
```

- [ ] **Step 2: Write the failing tests**

`packages/puejs/test/options.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { PueError } from "../src/errors";
import { defineOdor } from "../src/odor";
import { staccato, sustained } from "../src/odors";
import { resolveOptions } from "../src/options";

const custom = defineOdor({ name: "custom", src: "/custom.mp3" });

describe("resolveOptions", () => {
  it("defaults to the organic preset", () => {
    expect(resolveOptions()).toEqual({
      odors: [staccato, sustained],
      pitch: { min: 0.9, max: 1.1 },
      resonance: 0.4,
      duration: 320,
      volume: 0.8,
      tonnage: "logarithmic",
      threshold: 80,
      throttle: "velocity",
      respectReducedMotion: true,
      autoUnlock: true,
      audioContext: undefined,
    });
  });

  it("resolves presets by name or profile", () => {
    expect(resolveOptions({ preset: "deep" }).pitch).toEqual({ min: 0.6, max: 0.8 });
    expect(
      resolveOptions({
        preset: { odors: [custom], pitch: 1, resonance: 0, duration: 100, volume: 1, tonnage: "linear" },
      }).odors,
    ).toEqual([custom]);
  });

  it("merges explicit options over the preset", () => {
    const resolved = resolveOptions({ preset: "crisp", volume: 0.5, odors: [custom], pitch: 1.2 });
    expect(resolved.volume).toBe(0.5);
    expect(resolved.odors).toEqual([custom]);
    expect(resolved.pitch).toEqual({ min: 1.2, max: 1.2 });
    expect(resolved.duration).toBe(180);
  });

  it("returns frozen options", () => {
    const resolved = resolveOptions();
    expect(Object.isFrozen(resolved)).toBe(true);
    expect(Object.isFrozen(resolved.odors)).toBe(true);
    expect(Object.isFrozen(resolved.pitch)).toBe(true);
  });

  it.each([
    ["preset", { preset: "loud" }],
    ["pitch zero", { pitch: 0 }],
    ["pitch inverted", { pitch: { min: 2, max: 1 } }],
    ["resonance", { resonance: 2 }],
    ["volume", { volume: -1 }],
    ["duration", { duration: 0 }],
    ["threshold", { threshold: 3000 }],
    ["throttle", { throttle: -5 }],
    ["tonnage", { tonnage: "cubic" }],
    ["empty odors", { odors: [] }],
    ["invalid odor", { odors: [{}] }],
    ["autoUnlock", { autoUnlock: "yes" }],
    ["audioContext", { audioContext: 42 }],
  ])("rejects an invalid %s", (_label, options) => {
    expect(() => resolveOptions(options as never)).toThrow(PueError);
    try {
      resolveOptions(options as never);
    } catch (error) {
      expect((error as PueError).code).toBe("E_INVALID_OPTION");
    }
  });

  it("rejects non-object options", () => {
    expect(() => resolveOptions("organic" as never)).toThrow(PueError);
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — unresolved `../src/options`.

- [ ] **Step 4: Implement**

`packages/puejs/src/options.ts`:

```ts
import { PueError } from "./errors";
import { isOdor } from "./odor";
import { presets } from "./presets";
import { MAX_VELOCITY } from "./tonnage";
import type {
  AcousticProfile,
  EmitterOptions,
  Odor,
  PitchRange,
  PresetName,
  ResolvedOptions,
  ThrottleStrategy,
  TonnageCurve,
  TonnageCurveName,
} from "./types";

export const DEFAULT_THRESHOLD = 80;

// Declared as a function so that TypeScript treats calls as never returning.
function invalid(option: string, expected: string): never {
  throw new PueError("E_INVALID_OPTION", `Invalid option "${option}": expected ${expected}.`);
}

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

export function assertOptionsObject(value: unknown): asserts value is EmitterOptions {
  if (typeof value !== "object" || value === null || Array.isArray(value)) invalid("options", "an object");
}

const unitInterval = (option: string, value: unknown): number =>
  isFiniteNumber(value) && value >= 0 && value <= 1 ? value : invalid(option, "a number between 0 and 1");

const positive = (option: string, value: unknown): number =>
  isFiniteNumber(value) && value > 0 ? value : invalid(option, "a positive number");

const boolean = (option: string, value: unknown): boolean =>
  typeof value === "boolean" ? value : invalid(option, "a boolean");

function pitchRange(value: unknown): PitchRange {
  if (isFiniteNumber(value) && value > 0) return { min: value, max: value };
  if (typeof value === "object" && value !== null) {
    const { min, max } = value as Record<string, unknown>;
    if (isFiniteNumber(min) && isFiniteNumber(max) && min > 0 && min <= max) return { min, max };
  }
  return invalid("pitch", "a positive number or a { min, max } range with 0 < min <= max");
}

function tonnageCurve(value: unknown): TonnageCurveName | TonnageCurve {
  if (typeof value === "function") return value as TonnageCurve;
  if (value === "linear" || value === "logarithmic" || value === "exponential") return value;
  return invalid("tonnage", '"linear", "logarithmic", "exponential" or a function');
}

function odorList(value: unknown): readonly Odor[] {
  if (!Array.isArray(value) || value.length === 0) invalid("odors", "a non-empty array of odors");
  const odors = value as unknown[];
  if (!odors.every(isOdor)) invalid("odors", "odors created with defineOdor() or imported from puejs/odors");
  return Object.freeze([...(odors as Odor[])]);
}

function throttleStrategy(value: unknown): ThrottleStrategy {
  if (value === "velocity" || value === "distance") return value;
  if (isFiniteNumber(value) && value >= 0) return value;
  return invalid("throttle", '"velocity", "distance" or a non-negative number of milliseconds');
}

function profileFrom(preset: unknown): AcousticProfile {
  if (preset === undefined) return presets.organic;
  if (typeof preset === "string") {
    if (Object.prototype.hasOwnProperty.call(presets, preset)) return presets[preset as PresetName];
    return invalid("preset", `one of ${Object.keys(presets).join(", ")}`);
  }
  if (typeof preset === "object" && preset !== null) return preset as AcousticProfile;
  return invalid("preset", "a preset name or an acoustic profile");
}

/** Validates options, merges them over their preset and applies defaults. */
export function resolveOptions(options: EmitterOptions = {}): ResolvedOptions {
  assertOptionsObject(options);
  const profile = profileFrom(options.preset);
  const pick = (key: keyof AcousticProfile): unknown => options[key] ?? profile[key];

  const threshold = options.threshold ?? DEFAULT_THRESHOLD;
  if (!isFiniteNumber(threshold) || threshold < 0 || threshold >= MAX_VELOCITY) {
    invalid("threshold", `a number from 0 to ${MAX_VELOCITY} (exclusive)`);
  }
  const { audioContext } = options;
  if (audioContext !== undefined && (typeof audioContext !== "object" || audioContext === null)) {
    invalid("audioContext", "an AudioContext");
  }

  return Object.freeze({
    odors: odorList(pick("odors")),
    pitch: Object.freeze(pitchRange(pick("pitch"))),
    resonance: unitInterval("resonance", pick("resonance")),
    duration: positive("duration", pick("duration")),
    volume: unitInterval("volume", pick("volume")),
    tonnage: tonnageCurve(pick("tonnage")),
    threshold,
    throttle: throttleStrategy(options.throttle ?? "velocity"),
    respectReducedMotion: boolean("respectReducedMotion", options.respectReducedMotion ?? true),
    autoUnlock: boolean("autoUnlock", options.autoUnlock ?? true),
    audioContext,
  });
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn workspace puejs test && yarn workspace puejs typecheck`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/puejs
git commit -m "feat(puejs): add public types and option resolution"
```

---

### Task 5: Playback and Web Audio fakes

**Files:**
- Create: `packages/puejs/src/playback.ts`, `packages/puejs/test/fakes.ts`
- Test: `packages/puejs/test/playback.test.ts`

**Interfaces:**
- Consumes: `Odor` (Task 3).
- Produces:
  - `decodeDataUri(uri: string): ArrayBuffer`, `loadOdor(context: BaseAudioContext, odor: Odor, fetchArrayBuffer: (url: string) => Promise<ArrayBuffer>): Promise<AudioBuffer>`.
  - `interface VoiceParams { pitch: number; resonance: number; duration: number; gain: number; when: number }`, `playVoice(context: BaseAudioContext, buffer: AudioBuffer, params: VoiceParams, onEnded: () => void): AudioBufferSourceNode`, constants `FADE_OUT = 0.06`, `RESONANCE_FREQUENCY = 180`, `RESONANCE_MAX_GAIN = 12`.
  - Test fakes: `FakeAudioContext`, `FakeSource`, `FakeFilter`, `FakeGain`, `FakeParam`, `dataUri(text)` (Task 6 adds `FakeEnvironment`, `FakeScrollTarget`, `scrollAtSpeed`).

- [ ] **Step 1: Write the fakes**

`packages/puejs/test/fakes.ts`:

```ts
export class FakeParam {
  value = 0;
  events: Array<{ type: "set" | "ramp"; value: number; time: number }> = [];

  setValueAtTime(value: number, time: number): this {
    this.events.push({ type: "set", value, time });
    this.value = value;
    return this;
  }

  linearRampToValueAtTime(value: number, time: number): this {
    this.events.push({ type: "ramp", value, time });
    return this;
  }
}

class FakeNode {
  connections: unknown[] = [];
  disconnected = false;

  connect<T>(target: T): T {
    this.connections.push(target);
    return target;
  }

  disconnect(): void {
    this.disconnected = true;
  }
}

export class FakeSource extends FakeNode {
  buffer: unknown = null;
  playbackRate = new FakeParam();
  onended: (() => void) | null = null;
  startTime: number | undefined;
  /** Every stop() call; "now" when called without a time (voice stealing). */
  stopCalls: Array<number | "now"> = [];

  start(when = 0): void {
    this.startTime = when;
  }

  stop(when?: number): void {
    this.stopCalls.push(when ?? "now");
  }

  /** Simulates the end of playback. */
  end(): void {
    this.onended?.();
  }
}

export class FakeFilter extends FakeNode {
  type = "lowpass";
  frequency = new FakeParam();
  Q = new FakeParam();
  gain = new FakeParam();
}

export class FakeGain extends FakeNode {
  gain = new FakeParam();
}

export interface FakeAudioContextOptions {
  state?: "suspended" | "running";
  /** When false, resume() leaves the context suspended (no user activation). */
  allowResume?: boolean;
  /** When true, resume() never settles, like Chrome without user activation. */
  hangResume?: boolean;
}

export class FakeAudioContext {
  state: "suspended" | "running" | "closed";
  currentTime = 0;
  destination = { kind: "destination" };
  sources: FakeSource[] = [];
  decodeCalls = 0;
  allowResume: boolean;
  hangResume: boolean;
  private listeners = new Set<() => void>();

  constructor({ state = "running", allowResume = true, hangResume = false }: FakeAudioContextOptions = {}) {
    this.state = state;
    this.allowResume = allowResume;
    this.hangResume = hangResume;
  }

  addEventListener(type: string, listener: () => void): void {
    if (type === "statechange") this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener);
  }

  setState(next: "suspended" | "running" | "closed"): void {
    this.state = next;
    for (const listener of [...this.listeners]) listener();
  }

  resume(): Promise<void> {
    if (this.hangResume && !this.allowResume) return new Promise(() => {});
    if (this.allowResume && this.state === "suspended") this.setState("running");
    return Promise.resolve();
  }

  close(): Promise<void> {
    this.setState("closed");
    return Promise.resolve();
  }

  decodeAudioData(data: ArrayBuffer): Promise<{ duration: number; label: string }> {
    this.decodeCalls++;
    const text = new TextDecoder().decode(data);
    if (text.startsWith("BAD")) return Promise.reject(new Error("Unable to decode audio data"));
    return Promise.resolve({ duration: 0.36, label: text });
  }

  createBufferSource(): FakeSource {
    const source = new FakeSource();
    this.sources.push(source);
    return source;
  }

  createBiquadFilter(): FakeFilter {
    return new FakeFilter();
  }

  createGain(): FakeGain {
    return new FakeGain();
  }

  asAudioContext(): AudioContext {
    return this as unknown as AudioContext;
  }
}

export const dataUri = (text: string): string => `data:audio/mpeg;base64,${btoa(text)}`;
```

- [ ] **Step 2: Write the failing tests**

`packages/puejs/test/playback.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { defineOdor } from "../src/odor";
import { decodeDataUri, loadOdor, playVoice } from "../src/playback";
import { FakeAudioContext, type FakeFilter, type FakeGain, dataUri } from "./fakes";

const noFetch = (): Promise<ArrayBuffer> => Promise.reject(new Error("unexpected fetch"));

describe("decodeDataUri", () => {
  it("decodes base64 payloads", () => {
    expect(new TextDecoder().decode(decodeDataUri(dataUri("GOOD")))).toBe("GOOD");
  });

  it("rejects other URIs", () => {
    expect(() => decodeDataUri("https://example.com/a.mp3")).toThrow(TypeError);
    expect(() => decodeDataUri("data:audio/mpeg,raw")).toThrow(TypeError);
  });
});

describe("loadOdor", () => {
  it("decodes inline odors without fetching", async () => {
    const context = new FakeAudioContext();
    const buffer = await loadOdor(context.asAudioContext(), defineOdor({ name: "a", src: dataUri("GOOD a") }), noFetch);
    expect(buffer).toEqual({ duration: 0.36, label: "GOOD a" });
  });

  it("fetches URL odors", async () => {
    const context = new FakeAudioContext();
    const fetched: string[] = [];
    const fetchArrayBuffer = (url: string): Promise<ArrayBuffer> => {
      fetched.push(url);
      return Promise.resolve(new TextEncoder().encode("GOOD remote").buffer as ArrayBuffer);
    };
    const buffer = await loadOdor(context.asAudioContext(), defineOdor({ name: "r", src: "/r.mp3" }), fetchArrayBuffer);
    expect(fetched).toEqual(["/r.mp3"]);
    expect(buffer).toMatchObject({ label: "GOOD remote" });
  });

  it("caches decoded buffers per context", async () => {
    const odor = defineOdor({ name: "a", src: dataUri("GOOD cached") });
    const first = new FakeAudioContext();
    const second = new FakeAudioContext();
    await loadOdor(first.asAudioContext(), odor, noFetch);
    await loadOdor(first.asAudioContext(), odor, noFetch);
    await loadOdor(second.asAudioContext(), odor, noFetch);
    expect(first.decodeCalls).toBe(1);
    expect(second.decodeCalls).toBe(1);
  });

  it("allows retrying after a failure", async () => {
    const context = new FakeAudioContext();
    const odor = defineOdor({ name: "bad", src: dataUri("BAD") });
    await expect(loadOdor(context.asAudioContext(), odor, noFetch)).rejects.toThrow("Unable to decode");
    await expect(loadOdor(context.asAudioContext(), odor, noFetch)).rejects.toThrow("Unable to decode");
    expect(context.decodeCalls).toBe(2);
  });
});

describe("playVoice", () => {
  it("builds the source → filter → gain → destination graph", () => {
    const context = new FakeAudioContext();
    const buffer = { duration: 0.36 } as unknown as AudioBuffer;
    let ended = 0;
    playVoice(
      context.asAudioContext(),
      buffer,
      { pitch: 1.2, resonance: 0.5, duration: 320, gain: 0.6, when: 10 },
      () => ended++,
    );

    const [source] = context.sources;
    const filter = source.connections[0] as FakeFilter;
    const gain = filter.connections[0] as FakeGain;
    expect(source.buffer).toBe(buffer);
    expect(source.playbackRate.value).toBe(1.2);
    expect(filter.type).toBe("peaking");
    expect(filter.frequency.value).toBe(180);
    expect(filter.gain.value).toBe(6);
    expect(gain.connections[0]).toBe(context.destination);
    expect(gain.gain.events).toEqual([
      { type: "set", value: 0.6, time: 10 },
      { type: "set", value: 0.6, time: expect.closeTo(10.26, 5) },
      { type: "ramp", value: 0, time: expect.closeTo(10.32, 5) },
    ]);
    expect(source.startTime).toBe(10);
    expect(source.stopCalls).toEqual([expect.closeTo(10.32, 5)]);

    source.end();
    expect(ended).toBe(1);
    expect(source.disconnected && filter.disconnected && gain.disconnected).toBe(true);
  });

  it("starts the fade immediately for durations shorter than the fade", () => {
    const context = new FakeAudioContext();
    playVoice(context.asAudioContext(), {} as AudioBuffer, { pitch: 1, resonance: 0, duration: 30, gain: 1, when: 0 }, () => {});
    const gain = (context.sources[0].connections[0] as FakeFilter).connections[0] as FakeGain;
    expect(gain.gain.events[1]).toEqual({ type: "set", value: 1, time: 0 });
  });
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — unresolved `../src/playback`.

- [ ] **Step 4: Implement**

`packages/puejs/src/playback.ts`:

```ts
import type { Odor } from "./odor";

export interface VoiceParams {
  pitch: number;
  resonance: number;
  /** Maximum length of the emission, in milliseconds. */
  duration: number;
  gain: number;
  /** Start time, in the context's time coordinate system. */
  when: number;
}

export const FADE_OUT = 0.06;
export const RESONANCE_FREQUENCY = 180;
export const RESONANCE_MAX_GAIN = 12;

type FetchArrayBuffer = (url: string) => Promise<ArrayBuffer>;

const decoded = new WeakMap<BaseAudioContext, Map<string, Promise<AudioBuffer>>>();

/** Decodes a base64 data URI without a network request, which also keeps it clear of connect-src policies. */
export function decodeDataUri(uri: string): ArrayBuffer {
  const comma = uri.indexOf(",");
  if (!uri.startsWith("data:") || comma === -1 || !uri.slice(0, comma).endsWith(";base64")) {
    throw new TypeError("Expected a base64 data URI.");
  }
  const binary = atob(uri.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes.buffer;
}

/** Loads and decodes an odor once per context. Failed loads are evicted so they can be retried. */
export function loadOdor(
  context: BaseAudioContext,
  odor: Odor,
  fetchArrayBuffer: FetchArrayBuffer,
): Promise<AudioBuffer> {
  let cache = decoded.get(context);
  if (!cache) {
    cache = new Map();
    decoded.set(context, cache);
  }
  const cached = cache.get(odor.src);
  if (cached) return cached;

  const entries = cache;
  const promise = (async () => {
    const data = odor.src.startsWith("data:") ? decodeDataUri(odor.src) : await fetchArrayBuffer(odor.src);
    return context.decodeAudioData(data);
  })();
  entries.set(odor.src, promise);
  promise.catch(() => entries.delete(odor.src));
  return promise;
}

/** Plays one emission: source (pitch) → peaking filter (resonance) → gain (envelope) → destination. */
export function playVoice(
  context: BaseAudioContext,
  buffer: AudioBuffer,
  params: VoiceParams,
  onEnded: () => void,
): AudioBufferSourceNode {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = params.pitch;

  const filter = context.createBiquadFilter();
  filter.type = "peaking";
  filter.frequency.value = RESONANCE_FREQUENCY;
  filter.Q.value = 1;
  filter.gain.value = params.resonance * RESONANCE_MAX_GAIN;

  const envelope = context.createGain();
  const end = params.when + params.duration / 1000;
  const fadeStart = Math.max(params.when, end - FADE_OUT);
  envelope.gain.setValueAtTime(params.gain, params.when);
  envelope.gain.setValueAtTime(params.gain, fadeStart);
  envelope.gain.linearRampToValueAtTime(0, end);

  source.connect(filter);
  filter.connect(envelope);
  envelope.connect(context.destination);
  source.onended = () => {
    source.disconnect();
    filter.disconnect();
    envelope.disconnect();
    onEnded();
  };
  source.start(params.when);
  source.stop(end);
  return source;
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `yarn workspace puejs test && yarn workspace puejs typecheck && yarn workspace puejs lint`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add packages/puejs
git commit -m "feat(puejs): add sample decoding and web audio voice graph"
```

---

### Task 6: Environment abstraction and the emitter

**Files:**
- Create: `packages/puejs/src/environment.ts`, `packages/puejs/src/emitter.ts`
- Modify: `packages/puejs/test/fakes.ts`
- Test: `packages/puejs/test/emitter.test.ts`

**Interfaces:**
- Consumes: everything from Tasks 1–5.
- Produces:
  - `interface Environment` (below), `browserEnvironment(): Environment`, `isSupported(): boolean`, `trackedContexts: Set<AudioContext>`.
  - `type ScrollTarget = Window | Element`, `readScrollPosition(target: ScrollTarget): number`, `createEmitterWithEnvironment(target: ScrollTarget, options: EmitterOptions | undefined, env: Environment): Emitter`, constants `MAX_VOICES = 6`, `IDLE_TIMEOUT = 150`, `SCHEDULE_AHEAD = 0.005`.
  - Test fakes: `FakeEnvironment`, `FakeScrollTarget`, `scrollAtSpeed(env, target, pxPerSecond, frames, frameMs?)`.

- [ ] **Step 1: Write the environment module**

`packages/puejs/src/environment.ts`:

```ts
/** Every browser API the emitter touches, injectable for tests. */
export interface Environment {
  createAudioContext(): AudioContext;
  releaseAudioContext(context: AudioContext): void;
  now(): number;
  requestFrame(callback: () => void): number;
  cancelFrame(handle: number): void;
  isHidden(): boolean;
  viewportHeight(): number;
  watchReducedMotion(onChange: (reduced: boolean) => void): { reduced: boolean; dispose(): void };
  onUserGesture(callback: () => void): () => void;
  fetchArrayBuffer(url: string): Promise<ArrayBuffer>;
  /** Surfaces an exception thrown by an event handler without breaking the scroll loop. */
  reportError(error: unknown): void;
}

type AudioContextConstructor = new () => AudioContext;

function audioContextConstructor(): AudioContextConstructor | undefined {
  if (typeof window === "undefined") return undefined;
  const scope = window as unknown as { AudioContext?: AudioContextConstructor; webkitAudioContext?: AudioContextConstructor };
  return scope.AudioContext ?? scope.webkitAudioContext;
}

/** True when the Web Audio API is available. Always false on the server. */
export const isSupported = (): boolean => audioContextConstructor() !== undefined;

/** Contexts created by Pue JS, resumed by unlock(). */
export const trackedContexts = new Set<AudioContext>();

const GESTURES = ["pointerdown", "keydown", "touchend"] as const;

export function browserEnvironment(): Environment {
  return {
    createAudioContext() {
      const Constructor = audioContextConstructor();
      if (!Constructor) throw new Error("The Web Audio API is not available.");
      const context = new Constructor();
      trackedContexts.add(context);
      return context;
    },
    releaseAudioContext(context) {
      trackedContexts.delete(context);
      void context.close().catch(() => undefined);
    },
    now: () => performance.now(),
    requestFrame: (callback) => window.requestAnimationFrame(() => callback()),
    cancelFrame: (handle) => window.cancelAnimationFrame(handle),
    isHidden: () => document.visibilityState === "hidden",
    viewportHeight: () => window.innerHeight,
    watchReducedMotion(onChange) {
      const query = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (event: MediaQueryListEvent): void => onChange(event.matches);
      query.addEventListener("change", listener);
      return { reduced: query.matches, dispose: () => query.removeEventListener("change", listener) };
    },
    onUserGesture(callback) {
      const options = { capture: true, passive: true };
      for (const type of GESTURES) window.addEventListener(type, callback, options);
      return () => {
        for (const type of GESTURES) window.removeEventListener(type, callback, options);
      };
    },
    async fetchArrayBuffer(url) {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Request for ${url} failed with status ${response.status}.`);
      return response.arrayBuffer();
    },
    reportError(error) {
      queueMicrotask(() => {
        throw error;
      });
    },
  };
}
```

- [ ] **Step 2: Extend the fakes**

Append to `packages/puejs/test/fakes.ts`:

```ts
import type { Environment } from "../src/environment";

export class FakeEnvironment implements Environment {
  time = 0;
  hidden = false;
  reduced = false;
  viewport = 800;
  contextOptions: FakeAudioContextOptions = {};
  contexts: FakeAudioContext[] = [];
  errors: unknown[] = [];
  private frames = new Map<number, () => void>();
  private nextFrame = 1;
  private reducedWatchers = new Set<(reduced: boolean) => void>();
  private gestureListeners = new Set<() => void>();

  createAudioContext(): AudioContext {
    const context = new FakeAudioContext(this.contextOptions);
    this.contexts.push(context);
    return context.asAudioContext();
  }

  releaseAudioContext(context: AudioContext): void {
    void context.close();
  }

  now(): number {
    return this.time;
  }

  requestFrame(callback: () => void): number {
    const handle = this.nextFrame++;
    this.frames.set(handle, callback);
    return handle;
  }

  cancelFrame(handle: number): void {
    this.frames.delete(handle);
  }

  get pendingFrames(): number {
    return this.frames.size;
  }

  /** Advances time, then runs the frame callbacks queued before this call. */
  flushFrame(milliseconds = 16): void {
    this.time += milliseconds;
    const queued = [...this.frames.values()];
    this.frames.clear();
    for (const callback of queued) callback();
  }

  isHidden(): boolean {
    return this.hidden;
  }

  viewportHeight(): number {
    return this.viewport;
  }

  watchReducedMotion(onChange: (reduced: boolean) => void): { reduced: boolean; dispose(): void } {
    this.reducedWatchers.add(onChange);
    return { reduced: this.reduced, dispose: () => void this.reducedWatchers.delete(onChange) };
  }

  setReducedMotion(reduced: boolean): void {
    this.reduced = reduced;
    for (const watcher of this.reducedWatchers) watcher(reduced);
  }

  onUserGesture(callback: () => void): () => void {
    this.gestureListeners.add(callback);
    return () => void this.gestureListeners.delete(callback);
  }

  get gestureListenerCount(): number {
    return this.gestureListeners.size;
  }

  gesture(): void {
    for (const listener of [...this.gestureListeners]) listener();
  }

  fetchArrayBuffer(url: string): Promise<ArrayBuffer> {
    return Promise.reject(new Error(`No fake response for ${url}`));
  }

  reportError(error: unknown): void {
    this.errors.push(error);
  }
}

export class FakeScrollTarget {
  scrollY = 0;
  private listeners = new Set<() => void>();

  addEventListener(type: string, listener: () => void): void {
    if (type === "scroll") this.listeners.add(listener);
  }

  removeEventListener(_type: string, listener: () => void): void {
    this.listeners.delete(listener);
  }

  get listenerCount(): number {
    return this.listeners.size;
  }

  scrollTo(position: number): void {
    this.scrollY = position;
    for (const listener of [...this.listeners]) listener();
  }

  asTarget(): Window {
    return this as unknown as Window;
  }
}

/** Scrolls at a constant speed, flushing one animation frame per step. */
export function scrollAtSpeed(
  env: FakeEnvironment,
  target: FakeScrollTarget,
  pxPerSecond: number,
  frames: number,
  frameMs = 16,
): void {
  for (let frame = 0; frame < frames; frame++) {
    target.scrollTo(target.scrollY + (pxPerSecond * frameMs) / 1000);
    env.flushFrame(frameMs);
  }
}
```

Move the new `import type { Environment } from "../src/environment";` line to the top of `fakes.ts`.

- [ ] **Step 3: Write the failing tests**

`packages/puejs/test/emitter.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createEmitterWithEnvironment } from "../src/emitter";
import { PueError } from "../src/errors";
import { defineOdor } from "../src/odor";
import type { EmissionEvent, EmitterOptions } from "../src/types";
import { FakeAudioContext, type FakeAudioContextOptions, FakeEnvironment, FakeScrollTarget, type FakeFilter, type FakeGain, dataUri, scrollAtSpeed } from "./fakes";

const quiet = defineOdor({ name: "quiet", src: dataUri("GOOD quiet"), tonnage: [0, 0.6] });
const loud = defineOdor({ name: "loud", src: dataUri("GOOD loud"), tonnage: [0.4, 1] });
const broken = defineOdor({ name: "broken", src: dataUri("BAD") });

function setup(options: EmitterOptions = {}, contextOptions: FakeAudioContextOptions = {}) {
  const env = new FakeEnvironment();
  env.contextOptions = contextOptions;
  const target = new FakeScrollTarget();
  const emitter = createEmitterWithEnvironment(target.asTarget(), { odors: [quiet, loud], ...options }, env);
  const emissions: EmissionEvent[] = [];
  emitter.on("emit", (emission) => emissions.push(emission));
  const context = (): FakeAudioContext => env.contexts[0];
  return { env, target, emitter, emissions, context };
}

const tick = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 0));

const expectCode = (fn: () => unknown, code: PueError["code"]): void => {
  try {
    fn();
  } catch (error) {
    expect(error).toBeInstanceOf(PueError);
    expect((error as PueError).code).toBe(code);
    return;
  }
  throw new Error(`Expected ${code}`);
};

describe("lifecycle", () => {
  it("stays idle and allocates nothing before start()", () => {
    const { env, target, emitter } = setup();
    expect(emitter.state).toBe("idle");
    expect(emitter.context).toBeNull();
    expect(env.contexts).toHaveLength(0);
    expect(target.listenerCount).toBe(0);
  });

  it("starts running, decodes odors and observes scroll", async () => {
    const { emitter, target, context } = setup();
    await emitter.start();
    expect(emitter.state).toBe("running");
    expect(context().decodeCalls).toBe(2);
    expect(target.listenerCount).toBe(1);
  });

  it("reports state changes", async () => {
    const { emitter } = setup();
    const changes: string[] = [];
    emitter.on("statechange", ({ previous, current }) => changes.push(`${previous}->${current}`));
    await emitter.start();
    emitter.stop();
    expect(changes).toEqual(["idle->running", "running->idle"]);
  });

  it("is suspended when audio is blocked, then unlocks on the next gesture", async () => {
    const { env, emitter, context } = setup({}, { state: "suspended", allowResume: false });
    const unlocks: unknown[] = [];
    emitter.on("unlock", (event) => unlocks.push(event.context));
    await emitter.start();
    expect(emitter.state).toBe("suspended");
    expect(env.gestureListenerCount).toBe(1);

    context().allowResume = true;
    env.gesture();
    expect(emitter.state).toBe("running");
    expect(unlocks).toEqual([context()]);
    expect(env.gestureListenerCount).toBe(0);
  });

  it("does not hang when resume() never settles", async () => {
    const { emitter } = setup({}, { state: "suspended", allowResume: false, hangResume: true });
    await emitter.start();
    expect(emitter.state).toBe("suspended");
  });

  it("does not arm the gesture listener without autoUnlock", async () => {
    const { env, emitter } = setup({ autoUnlock: false }, { state: "suspended", allowResume: false });
    await emitter.start();
    expect(emitter.state).toBe("suspended");
    expect(env.gestureListenerCount).toBe(0);
  });

  it("attaches a single listener when start() is called twice", async () => {
    const { emitter, target } = setup();
    await Promise.all([emitter.start(), emitter.start()]);
    expect(target.listenerCount).toBe(1);
  });

  it("stays idle when stop() is called while start() is decoding", async () => {
    const { emitter, target } = setup();
    const pending = emitter.start();
    emitter.stop();
    await pending;
    expect(emitter.state).toBe("idle");
    expect(target.listenerCount).toBe(0);
  });

  it("can be restarted after stop()", async () => {
    const { env, emitter, target, emissions } = setup();
    await emitter.start();
    emitter.stop();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions.length).toBeGreaterThan(0);
  });
});

describe("emissions", () => {
  it("plays a voice when scrolling above the threshold", async () => {
    const { env, target, emitter, emissions, context } = setup();
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);

    expect(emissions.length).toBeGreaterThan(0);
    expect(context().sources).toHaveLength(emissions.length);
    const [first] = emissions;
    const source = context().sources[0];
    const gain = (source.connections[0] as FakeFilter).connections[0] as FakeGain;
    expect(first.direction).toBe(1);
    expect(first.velocity).toBeGreaterThan(80);
    expect(first.pitch).toBeGreaterThanOrEqual(0.9);
    expect(first.pitch).toBeLessThanOrEqual(1.1);
    expect(source.playbackRate.value).toBe(first.pitch);
    expect(gain.gain.events[0].value).toBeCloseTo(0.8 * (0.25 + 0.75 * first.tonnage), 5);
    expect(first.timestamp).toBeCloseTo(0.005, 5);
  });

  it("reports the scroll direction", async () => {
    const { env, target, emitter, emissions } = setup();
    target.scrollY = 5000;
    await emitter.start();
    scrollAtSpeed(env, target, -2000, 10);
    expect(emissions.every((emission) => emission.direction === -1)).toBe(true);
  });

  it("ignores scrolling below the threshold", async () => {
    const { env, target, emitter, emissions } = setup();
    await emitter.start();
    scrollAtSpeed(env, target, 50, 30);
    expect(emissions).toHaveLength(0);
  });

  it("does not emit on frames without movement", async () => {
    const { env, target, emitter, emissions } = setup({ threshold: 0, throttle: 0 });
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 5);
    const count = emissions.length;
    for (let frame = 0; frame < 20; frame++) env.flushFrame();
    expect(emissions).toHaveLength(count);
    expect(env.pendingFrames).toBe(0);
  });

  it("applies a fixed throttle", async () => {
    const { env, target, emitter, emissions } = setup({ throttle: 1000 });
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 30);
    expect(emissions).toHaveLength(1);
  });

  it("caps polyphony at six voices by stopping the oldest", async () => {
    const { env, target, emitter, context } = setup({ throttle: 0 });
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 12);
    const sources = context().sources;
    expect(sources.length).toBeGreaterThan(6);
    const stolen = sources.filter((source) => source.stopCalls.includes("now"));
    expect(stolen).toEqual(sources.slice(0, sources.length - 6));
  });

  it("selects odors by tonnage", async () => {
    const slow = setup();
    await slow.emitter.start();
    scrollAtSpeed(slow.env, slow.target, 150, 40);
    expect(slow.emissions.length).toBeGreaterThan(0);
    expect(slow.emissions.every((emission) => emission.odor === "quiet")).toBe(true);

    const fast = setup();
    await fast.emitter.start();
    scrollAtSpeed(fast.env, fast.target, 4000, 40);
    expect(fast.emissions.at(-1)?.odor).toBe("loud");
  });

  it("is deterministic", async () => {
    const first = setup();
    const second = setup();
    await first.emitter.start();
    await second.emitter.start();
    scrollAtSpeed(first.env, first.target, 1800, 40);
    scrollAtSpeed(second.env, second.target, 1800, 40);
    expect(first.emissions).toEqual(second.emissions);
  });

  it("stays silent when the user prefers reduced motion", async () => {
    const { env, target, emitter, emissions } = setup();
    env.reduced = true;
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
  });

  it("follows reduced motion changes live", async () => {
    const { env, target, emitter, emissions } = setup();
    await emitter.start();
    env.setReducedMotion(true);
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
  });

  it("can ignore reduced motion", async () => {
    const { env, target, emitter, emissions } = setup({ respectReducedMotion: false });
    env.reduced = true;
    await emitter.start();
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions.length).toBeGreaterThan(0);
  });

  it("stays silent while the document is hidden", async () => {
    const { env, target, emitter, emissions } = setup();
    await emitter.start();
    env.hidden = true;
    scrollAtSpeed(env, target, 2000, 10);
    expect(emissions).toHaveLength(0);
  });

  it("emits manually", async () => {
    const { emitter, emissions } = setup();
    emitter.emit({ tonnage: 1 });
    expect(emissions).toHaveLength(0);
    await emitter.start();
    emitter.emit({ tonnage: 1 });
    expect(emissions).toEqual([expect.objectContaining({ tonnage: 1, velocity: 0, odor: "loud" })]);
    emitter.emit({ odor: quiet });
    expect(emissions.at(-1)?.odor).toBe("quiet");
    expectCode(() => emitter.emit({ tonnage: 2 }), "E_INVALID_OPTION");
  });
});

describe("updates and errors", () => {
  it("applies updated options to the next emission", async () => {
    const { emitter, context } = setup();
    await emitter.start();
    emitter.update({ volume: 0.5 });
    emitter.emit({ tonnage: 1 });
    const gain = (context().sources[0].connections[0] as FakeFilter).connections[0] as FakeGain;
    expect(gain.gain.events[0].value).toBeCloseTo(0.5, 5);
  });

  it("keeps the previous options when an update is invalid", async () => {
    const { emitter } = setup({ volume: 0.3 });
    expectCode(() => emitter.update({ volume: 4 }), "E_INVALID_OPTION");
    expect(emitter.options.volume).toBe(0.3);
  });

  it("refuses to change the audio context after start()", async () => {
    const { emitter } = setup();
    await emitter.start();
    expectCode(() => emitter.update({ audioContext: new FakeAudioContext().asAudioContext() }), "E_INVALID_OPTION");
  });

  it("reports undecodable odors and keeps running with the others", async () => {
    const { env, target, emitter, emissions } = setup({ odors: [broken, quiet] });
    const errors: PueError[] = [];
    emitter.on("error", (error) => errors.push(error));
    await emitter.start();
    expect(errors.map((error) => error.code)).toEqual(["E_DECODE"]);
    expect(emitter.state).toBe("running");
    scrollAtSpeed(env, target, 300, 20);
    expect(emissions.length).toBeGreaterThan(0);
    expect(emissions.every((emission) => emission.odor === "quiet")).toBe(true);
  });

  it("isolates exceptions thrown by handlers", async () => {
    const { env, emitter, emissions } = setup();
    emitter.on("emit", () => {
      throw new Error("handler failure");
    });
    const after: EmissionEvent[] = [];
    emitter.on("emit", (emission) => after.push(emission));
    await emitter.start();
    emitter.emit();
    expect(env.errors).toHaveLength(1);
    expect(emissions).toHaveLength(1);
    expect(after).toHaveLength(1);
  });
});

describe("destroy", () => {
  it("releases everything and rejects further calls", async () => {
    const { emitter, target, context } = setup();
    await emitter.start();
    emitter.destroy();
    expect(emitter.state).toBe("destroyed");
    expect(target.listenerCount).toBe(0);
    expect(context().state).toBe("closed");
    expectCode(() => emitter.start(), "E_DESTROYED");
    expectCode(() => emitter.stop(), "E_DESTROYED");
    expectCode(() => emitter.update({ volume: 0.1 }), "E_DESTROYED");
    expectCode(() => emitter.emit(), "E_DESTROYED");
    expectCode(() => emitter.on("emit", () => {}), "E_DESTROYED");
  });

  it("is idempotent and keeps off() safe", async () => {
    const { emitter } = setup();
    const handler = (): void => {};
    emitter.on("emit", handler);
    emitter.destroy();
    expect(() => emitter.destroy()).not.toThrow();
    expect(() => emitter.off("emit", handler)).not.toThrow();
  });

  it("leaves a shared audio context open", async () => {
    const shared = new FakeAudioContext();
    const { emitter } = setup({ audioContext: shared.asAudioContext() });
    await emitter.start();
    emitter.destroy();
    expect(shared.state).toBe("running");
  });

  it("stops in-flight voices", async () => {
    const { emitter, context } = setup();
    await emitter.start();
    emitter.emit();
    emitter.destroy();
    expect(context().sources[0].stopCalls).toContain("now");
  });

  it("ignores decodes that finish after destroy()", async () => {
    const { emitter } = setup();
    const pending = emitter.start();
    emitter.destroy();
    await pending;
    await tick();
    expect(emitter.state).toBe("destroyed");
  });
});
```

- [ ] **Step 4: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — unresolved `../src/emitter`.

- [ ] **Step 5: Implement the emitter**

`packages/puejs/src/emitter.ts`:

```ts
import { PueError, destroyedError } from "./errors";
import type { Environment } from "./environment";
import { createKinematics, updateKinematics, type KinematicsState } from "./kinematics";
import { isOdor, type Odor } from "./odor";
import { assertOptionsObject, resolveOptions } from "./options";
import { loadOdor, playVoice } from "./playback";
import { createRandom } from "./random";
import { selectOdor } from "./selection";
import { canEmit, type ThrottleState } from "./throttle";
import { computeTonnage } from "./tonnage";
import type {
  EmissionInput,
  Emitter,
  EmitterEventHandler,
  EmitterEvents,
  EmitterOptions,
  EmitterState,
  ResolvedOptions,
} from "./types";

export type ScrollTarget = Window | Element;

export const MAX_VOICES = 6;
/** Time without movement after which the frame loop stops, in milliseconds. */
export const IDLE_TIMEOUT = 150;
/** Lead time applied to every emission to absorb scheduling jitter, in seconds. */
export const SCHEDULE_AHEAD = 0.005;

export const readScrollPosition = (target: ScrollTarget): number =>
  "scrollY" in target ? target.scrollY : target.scrollTop;

type Handler = (payload: unknown) => void;

export function createEmitterWithEnvironment(
  target: ScrollTarget,
  options: EmitterOptions | undefined,
  env: Environment,
): Emitter {
  let resolved: ResolvedOptions = resolveOptions(options);
  let userOptions: EmitterOptions = { ...options };
  let state: EmitterState = "idle";
  let context: AudioContext | null = null;
  let ownsContext = false;
  let startToken = 0;
  let pendingStart: Promise<void> | null = null;
  const handlers = new Map<keyof EmitterEvents, Set<Handler>>();
  const random = createRandom();
  const buffers = new Map<Odor, AudioBuffer>();
  const voices: AudioBufferSourceNode[] = [];
  let kinematics: KinematicsState | null = null;
  let throttleState: ThrottleState = { lastTime: Number.NEGATIVE_INFINITY, lastPosition: 0 };
  let frame: number | null = null;
  let lastMovement = 0;
  let reducedMotion = false;
  let cleanups: Array<() => void> = [];
  let disarmUnlock: (() => void) | null = null;

  function dispatch<E extends keyof EmitterEvents>(event: E, payload: EmitterEvents[E]): void {
    const set = handlers.get(event);
    if (!set) return;
    for (const handler of [...set]) {
      try {
        handler(payload);
      } catch (error) {
        env.reportError(error);
      }
    }
  }

  function setState(next: EmitterState): void {
    if (next === state) return;
    const previous = state;
    state = next;
    dispatch("statechange", { previous, current: next });
  }

  function assertAlive(): void {
    if (state === "destroyed") throw destroyedError();
  }

  async function decode(odors: readonly Odor[]): Promise<void> {
    const ctx = context;
    if (!ctx) return;
    await Promise.all(
      odors.map(async (odor) => {
        if (buffers.has(odor)) return;
        try {
          const buffer = await loadOdor(ctx, odor, (url) => env.fetchArrayBuffer(url));
          if (context === ctx) buffers.set(odor, buffer);
        } catch (cause) {
          if (context === ctx) {
            dispatch("error", new PueError("E_DECODE", `The odor "${odor.name}" could not be decoded.`, { cause }));
          }
        }
      }),
    );
  }

  function play(tonnage: number, velocity: number, direction: 1 | -1, detectedAt: number, forced?: Odor): boolean {
    const ctx = context;
    if (!ctx) return false;
    const candidates = resolved.odors.filter((odor) => buffers.has(odor));
    const odor = forced ?? selectOdor(candidates, tonnage, random);
    const buffer = odor ? buffers.get(odor) : undefined;
    if (!odor || !buffer) return false;

    const pitch = resolved.pitch.min + (resolved.pitch.max - resolved.pitch.min) * random();
    if (voices.length >= MAX_VOICES) {
      try {
        voices.shift()?.stop();
      } catch {
        // The oldest voice already ended.
      }
    }
    const when = ctx.currentTime + SCHEDULE_AHEAD;
    const source = playVoice(
      ctx,
      buffer,
      {
        pitch,
        resonance: resolved.resonance,
        duration: resolved.duration,
        gain: resolved.volume * (0.25 + 0.75 * tonnage),
        when,
      },
      () => {
        const index = voices.indexOf(source);
        if (index !== -1) voices.splice(index, 1);
      },
    );
    voices.push(source);
    dispatch("emit", { tonnage, velocity, direction, pitch, odor: odor.name, latency: env.now() - detectedAt, timestamp: when });
    return true;
  }

  function detect(now: number, position: number, signedVelocity: number): void {
    if (state !== "running") return;
    if (env.isHidden() || (resolved.respectReducedMotion && reducedMotion)) return;
    const velocity = Math.abs(signedVelocity);
    if (velocity < resolved.threshold) return;
    const tonnage = computeTonnage(velocity, resolved.threshold, resolved.tonnage);
    const frameInfo = { time: now, position, tonnage, viewportHeight: env.viewportHeight() };
    if (!canEmit(resolved.throttle, throttleState, frameInfo)) return;
    if (play(tonnage, velocity, signedVelocity < 0 ? -1 : 1, now)) {
      throttleState = { lastTime: now, lastPosition: position };
    }
  }

  const tick = (): void => {
    frame = null;
    const now = env.now();
    const position = readScrollPosition(target);
    if (kinematics === null) {
      kinematics = createKinematics(position, now);
      lastMovement = now;
      frame = env.requestFrame(tick);
      return;
    }
    const moved = position !== kinematics.position;
    kinematics = updateKinematics(kinematics, position, now);
    if (moved) {
      lastMovement = now;
      detect(now, position, kinematics.velocity);
    }
    if (now - lastMovement < IDLE_TIMEOUT) frame = env.requestFrame(tick);
    else kinematics = null;
  };

  const onScroll = (): void => {
    if (frame === null) frame = env.requestFrame(tick);
  };

  function armUnlock(): void {
    const ctx = context;
    if (!resolved.autoUnlock || disarmUnlock || !ctx) return;
    disarmUnlock = env.onUserGesture(() => {
      void ctx.resume().catch(() => undefined);
    });
  }

  function syncContextState(): void {
    if (!context || state === "idle" || state === "destroyed") return;
    if (context.state === "running" && state === "suspended") {
      disarmUnlock?.();
      disarmUnlock = null;
      setState("running");
      dispatch("unlock", { context });
    } else if (context.state !== "running" && state === "running") {
      setState("suspended");
      armUnlock();
    }
  }

  // Window and Element have incompatible addEventListener overloads; both are EventTargets.
  const scrollEvents: EventTarget = target;

  function attach(ctx: AudioContext): void {
    const onStateChange = (): void => syncContextState();
    ctx.addEventListener("statechange", onStateChange);
    scrollEvents.addEventListener("scroll", onScroll, { passive: true });
    const watcher = env.watchReducedMotion((reduced) => {
      reducedMotion = reduced;
    });
    reducedMotion = watcher.reduced;
    throttleState = { lastTime: Number.NEGATIVE_INFINITY, lastPosition: readScrollPosition(target) };
    cleanups = [
      () => ctx.removeEventListener("statechange", onStateChange),
      () => scrollEvents.removeEventListener("scroll", onScroll),
      () => watcher.dispose(),
    ];
  }

  function detach(): void {
    for (const cleanup of cleanups) cleanup();
    cleanups = [];
    disarmUnlock?.();
    disarmUnlock = null;
    if (frame !== null) {
      env.cancelFrame(frame);
      frame = null;
    }
    kinematics = null;
  }

  return {
    get state() {
      return state;
    },
    get context() {
      return context;
    },
    get options() {
      return resolved;
    },

    start() {
      assertAlive();
      if (state !== "idle") return Promise.resolve();
      if (pendingStart) return pendingStart;
      const token = ++startToken;
      if (!context) {
        ownsContext = resolved.audioContext === undefined;
        context = resolved.audioContext ?? env.createAudioContext();
      }
      const ctx = context;
      attach(ctx);
      // Resume synchronously so that a call made from a user gesture unlocks audio. Never awaited:
      // without activation, some browsers keep this promise pending until the next gesture.
      void ctx.resume().catch(() => undefined);
      const promise: Promise<void> = decode(resolved.odors)
        .then(() => {
          if (token !== startToken) return;
          if (ctx.state === "running") {
            setState("running");
          } else {
            setState("suspended");
            armUnlock();
          }
        })
        .finally(() => {
          if (pendingStart === promise) pendingStart = null;
        });
      pendingStart = promise;
      return promise;
    },

    stop() {
      assertAlive();
      if (state === "idle" && !pendingStart) return;
      startToken++;
      pendingStart = null;
      detach();
      setState("idle");
    },

    update(partial) {
      assertAlive();
      assertOptionsObject(partial);
      if (context && partial.audioContext !== undefined && partial.audioContext !== resolved.audioContext) {
        throw new PueError("E_INVALID_OPTION", 'The "audioContext" option cannot be changed after start().');
      }
      const nextOptions = { ...userOptions, ...partial };
      resolved = resolveOptions(nextOptions);
      userOptions = nextOptions;
      if (context) void decode(resolved.odors);
    },

    emit(input: EmissionInput = {}) {
      assertAlive();
      const tonnage = input.tonnage ?? 0.5;
      if (typeof tonnage !== "number" || !Number.isFinite(tonnage) || tonnage < 0 || tonnage > 1) {
        throw new PueError("E_INVALID_OPTION", 'Invalid emission "tonnage": expected a number between 0 and 1.');
      }
      if (input.odor !== undefined && !isOdor(input.odor)) {
        throw new PueError("E_INVALID_OPTION", 'Invalid emission "odor": expected an odor.');
      }
      if (state !== "running") return;
      if (input.odor && !buffers.has(input.odor)) {
        void decode([input.odor]);
        return;
      }
      play(tonnage, 0, 1, env.now(), input.odor);
    },

    on<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>) {
      assertAlive();
      let set = handlers.get(event);
      if (!set) {
        set = new Set();
        handlers.set(event, set);
      }
      set.add(handler as Handler);
      return () => {
        handlers.get(event)?.delete(handler as Handler);
      };
    },

    off<E extends keyof EmitterEvents>(event: E, handler: EmitterEventHandler<E>) {
      handlers.get(event)?.delete(handler as Handler);
    },

    destroy() {
      if (state === "destroyed") return;
      startToken++;
      pendingStart = null;
      detach();
      for (const voice of voices.splice(0)) {
        try {
          voice.stop();
        } catch {
          // Already ended.
        }
      }
      if (context && ownsContext) env.releaseAudioContext(context);
      context = null;
      buffers.clear();
      setState("destroyed");
      handlers.clear();
    },
  };
}
```

Note on "manual emit with a forced odor not decoded yet": `emitter.emit({ odor: quiet })` in the test works because `quiet` is part of the decoded odors.

- [ ] **Step 6: Run the tests to verify they pass**

Run: `yarn workspace puejs test`
Expected: PASS. If "caps polyphony" fails because fewer than 7 sources were created, increase the scroll to 20 frames — `throttle: 0` must emit on every moving frame.

Run: `yarn workspace puejs typecheck && yarn workspace puejs lint`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add packages/puejs
git commit -m "feat(puejs): add environment abstraction and emitter"
```

---

### Task 7: Public entry point, inert emitter, build and README

**Files:**
- Create: `packages/puejs/src/inert.ts`, `packages/puejs/src/index.ts`, `packages/puejs/scripts/size.ts`, `packages/puejs/README.md`
- Test: `packages/puejs/test/index.test.ts`

**Interfaces:**
- Consumes: Tasks 1–6.
- Produces (public API of `puejs`): `createEmitter(target: ScrollTarget, options?: EmitterOptions): Emitter`, `unlock(context?: AudioContext): Promise<boolean>`, `isSupported`, `defineOdor`, `defineTonnageCurve`, `presets`, `PueError`, and the types `AcousticProfile`, `EmissionEvent`, `EmissionInput`, `Emitter`, `EmitterEventHandler`, `EmitterEvents`, `EmitterOptions`, `EmitterState`, `Odor`, `OdorDefinition`, `PitchRange`, `PresetName`, `PueErrorCode`, `ResolvedOptions`, `ScrollTarget`, `ThrottleStrategy`, `TonnageCurve`, `TonnageCurveName`.

- [ ] **Step 1: Write the failing tests**

`packages/puejs/test/index.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { PueError, createEmitter, isSupported, presets, unlock } from "../src/index";
import { FakeAudioContext, FakeScrollTarget } from "./fakes";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isSupported", () => {
  it("is false on the server", () => {
    expect(isSupported()).toBe(false);
  });

  it("detects the Web Audio API", () => {
    vi.stubGlobal("window", { AudioContext: class {} });
    expect(isSupported()).toBe(true);
  });
});

describe("createEmitter without Web Audio", () => {
  it("returns an inert emitter with the same API", async () => {
    const emitter = createEmitter(new FakeScrollTarget().asTarget(), { preset: "crisp" });
    expect(emitter.state).toBe("idle");
    expect(emitter.context).toBeNull();
    expect(emitter.options.odors).toEqual(presets.crisp.odors);
    await expect(emitter.start()).resolves.toBeUndefined();
    expect(emitter.state).toBe("idle");
    emitter.update({ volume: 0.2 });
    expect(emitter.options.volume).toBe(0.2);
    emitter.emit();
    const off = emitter.on("emit", () => {});
    off();
    emitter.stop();
    emitter.destroy();
    emitter.destroy();
    expect(emitter.state).toBe("destroyed");
    expect(() => emitter.start()).toThrow(PueError);
  });

  it("still validates options", () => {
    expect(() => createEmitter(new FakeScrollTarget().asTarget(), { volume: 3 })).toThrow(PueError);
  });
});

describe("unlock", () => {
  it("resumes the given context", async () => {
    const context = new FakeAudioContext({ state: "suspended" });
    await expect(unlock(context.asAudioContext())).resolves.toBe(true);
    expect(context.state).toBe("running");
  });

  it("reports blocked contexts", async () => {
    const context = new FakeAudioContext({ state: "suspended", allowResume: false });
    await expect(unlock(context.asAudioContext())).resolves.toBe(false);
  });

  it("is false when there is nothing to unlock", async () => {
    await expect(unlock()).resolves.toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn workspace puejs test`
Expected: FAIL — unresolved `../src/index`.

- [ ] **Step 3: Implement**

`packages/puejs/src/inert.ts`:

```ts
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
```

`packages/puejs/src/index.ts`:

```ts
import { createEmitterWithEnvironment, type ScrollTarget } from "./emitter";
import { browserEnvironment, isSupported, trackedContexts } from "./environment";
import { createInertEmitter } from "./inert";
import type { Emitter, EmitterOptions } from "./types";

/** Binds an acoustic profile to a scroll container. Inert on the server and without Web Audio. */
export function createEmitter(target: ScrollTarget, options?: EmitterOptions): Emitter {
  return isSupported() ? createEmitterWithEnvironment(target, options, browserEnvironment()) : createInertEmitter(options);
}

/** Resumes the given context, or every context created by Pue JS, from within a user gesture. */
export async function unlock(context?: AudioContext): Promise<boolean> {
  const contexts = context ? [context] : [...trackedContexts];
  await Promise.all(contexts.map((item) => item.resume().catch(() => undefined)));
  return contexts.length > 0 && contexts.every((item) => item.state === "running");
}

export { isSupported } from "./environment";
export { PueError } from "./errors";
export type { PueErrorCode } from "./errors";
export { defineOdor } from "./odor";
export type { OdorDefinition } from "./odor";
export { presets } from "./presets";
export { defineTonnageCurve } from "./tonnage";
export type { ScrollTarget } from "./emitter";
export type {
  AcousticProfile,
  EmissionEvent,
  EmissionInput,
  Emitter,
  EmitterEventHandler,
  EmitterEvents,
  EmitterOptions,
  EmitterState,
  Odor,
  PitchRange,
  PresetName,
  ResolvedOptions,
  ThrottleStrategy,
  TonnageCurve,
  TonnageCurveName,
} from "./types";
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn workspace puejs test && yarn workspace puejs typecheck && yarn workspace puejs lint`
Expected: PASS.

- [ ] **Step 5: Build and smoke-test the published entry points**

Run: `yarn workspace puejs build`
Expected: `dist/index.js`, `dist/index.d.ts`, `dist/odors/index.js`, `dist/odors/index.d.ts` (plus shared chunks).

Run:

```bash
cd packages/puejs && node -e "Promise.all([import('./dist/index.js'), import('./dist/odors/index.js')]).then(([core, odors]) => console.log(Object.keys(core).sort().join(','), '|', Object.keys(odors).sort().join(',')))"
```

Expected: `PueError,createEmitter,defineOdor,defineTonnageCurve,isSupported,presets,unlock | staccato,sustained`

Run: `cd packages/puejs && npm pack --dry-run 2>&1 | grep -E "dist/|LICENSE|README|package.json"`
Expected: only `LICENSE`, `README.md`, `package.json` and `dist/**` are listed (no `src`, `test`, `assets`, `scripts`).

- [ ] **Step 6: Add the size script**

`packages/puejs/scripts/size.ts`:

```ts
// Prints gzip sizes of the built package. Run after `yarn build`.
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const javascriptFiles = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return javascriptFiles(path);
    return entry.name.endsWith(".js") ? [path] : [];
  });

const gzip = (data: string | Buffer): number => gzipSync(data).length;
const kilobytes = (bytes: number): string => `${(bytes / 1000).toFixed(1)} kB`;

const total = gzip(Buffer.concat(javascriptFiles(join(root, "dist")).map((file) => readFileSync(file))));
const odors = ["staccato", "sustained"].map((name) => {
  const source = readFileSync(join(root, "src", "odors", `${name}.ts`), "utf8");
  const payload = /base64,([A-Za-z0-9+/=]+)/.exec(source)?.[1] ?? "";
  return { name, size: gzip(payload) };
});
const odorsTotal = odors.reduce((sum, odor) => sum + odor.size, 0);

console.log(`total (core + odors): ${kilobytes(total)} gzip`);
for (const odor of odors) console.log(`${odor.name}: ${kilobytes(odor.size)} gzip`);
console.log(`core without odors: ${kilobytes(total - odorsTotal)} gzip`);
```

Run: `yarn workspace puejs size`
Expected: three lines of sizes. **Write the four numbers down — Task 9 uses them** (`TOTAL`, `STACCATO`, `SUSTAINED`, `CORE`).

- [ ] **Step 7: Write the README**

`packages/puejs/README.md`:

````md
# Pue JS

Next-generation acoustic feedback for modern web applications. Zero-dependency, strictly typed, purely organic scroll interactions.

Documentation: [www.puejs.org](https://www.puejs.org)

## Install

```sh
npm install puejs
```

## Usage

```ts
import { createEmitter } from "puejs";

const emitter = createEmitter(window, { preset: "organic" });

// Browsers only allow audio after a user gesture.
button.addEventListener("click", () => emitter.start());
```

Scrolling above 80 px/s now triggers emissions whose pitch and gain follow the scroll velocity.

## Options

| Option                 | Default        | Description                                               |
| ---------------------- | -------------- | --------------------------------------------------------- |
| `preset`               | `"organic"`    | `organic`, `crisp`, `deep`, `discreet` or a full profile  |
| `odors`                | preset odors   | Samples available to the emitter                          |
| `pitch`                | preset         | Playback rate, or a `{ min, max }` range                  |
| `resonance`            | preset         | Low-frequency body, from 0 to 1                           |
| `duration`             | preset         | Maximum emission length in milliseconds                   |
| `volume`               | preset         | Master gain, from 0 to 1                                  |
| `tonnage`              | `"logarithmic"`| Velocity to intensity curve, or a custom function         |
| `threshold`            | `80`           | Minimum velocity in px/s                                  |
| `throttle`             | `"velocity"`   | `"velocity"`, `"distance"` or an interval in milliseconds |
| `respectReducedMotion` | `true`         | Stay silent when the user prefers reduced motion          |
| `autoUnlock`           | `true`         | Resume blocked audio on the next user gesture             |
| `audioContext`         | private        | Share an existing `AudioContext`                          |

## Odors

Built-in samples are inlined, so there is nothing to host:

```ts
import { createEmitter } from "puejs";
import { staccato } from "puejs/odors";

createEmitter(window, { odors: [staccato] });
```

Use your own samples with `defineOdor`:

```ts
import { createEmitter, defineOdor } from "puejs";

const custom = defineOdor({ name: "custom", src: "/sounds/custom.mp3", tonnage: [0.3, 1] });
createEmitter(window, { odors: [custom] });
```

## License

Released into the public domain under the [Unlicense](./LICENSE).
````

- [ ] **Step 8: Commit**

```bash
git add packages/puejs
git commit -m "feat(puejs): add public entry point, inert emitter, size script and readme"
```

---

### Task 8: Live demo on puejs.org

**Files:**
- Modify: `apps/docs/package.json`, `apps/docs/panda.config.ts`, `apps/docs/components/site/navbar.tsx`, `apps/docs/components/site/icons.tsx`, `apps/docs/components/landing/hero.tsx`
- Create: `apps/docs/components/site/acoustic-feedback.ts`, `apps/docs/components/site/acoustic-toggle.tsx`, `apps/docs/components/landing/emission-ripples.tsx`

**Interfaces:**
- Consumes: `createEmitter`, `Emitter`, `EmissionEvent` from `puejs` (Task 7).
- Produces: `subscribe(listener): () => void`, `getSnapshot(): boolean`, `getServerSnapshot(): boolean`, `restore(): void`, `setEnabled(next: boolean): void`, `onEmission(listener: (emission: EmissionEvent) => void): () => void` from `acoustic-feedback.ts`; `<AcousticToggle />`; `<EmissionRipples />`.

- [ ] **Step 1: Depend on the workspace package**

In `apps/docs/package.json` dependencies, add `"puejs": "*",` (alphabetical order, after `"next"`).

Run: `yarn install && yarn workspace puejs build`
Expected: `success Saved lockfile.`; `ls apps/docs/node_modules/puejs 2>/dev/null || ls node_modules/puejs` shows the symlinked package.

- [ ] **Step 2: Create the client-side store**

`apps/docs/components/site/acoustic-feedback.ts`:

```ts
import { createEmitter, type EmissionEvent, type Emitter } from "puejs";

const STORAGE_KEY = "puejs:acoustic-feedback";

let emitter: Emitter | null = null;
let enabled = false;
let restored = false;
const listeners = new Set<() => void>();
const emissionListeners = new Set<(emission: EmissionEvent) => void>();

function getEmitter(): Emitter {
  if (!emitter) {
    emitter = createEmitter(window, { preset: "organic" });
    emitter.on("emit", (emission) => {
      for (const listener of emissionListeners) listener(emission);
    });
  }
  return emitter;
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export const getSnapshot = (): boolean => enabled;

export const getServerSnapshot = (): boolean => false;

/** Turns acoustic feedback on or off. Must be called from a user gesture to unlock audio immediately. */
export function setEnabled(next: boolean): void {
  if (next === enabled) return;
  enabled = next;
  try {
    localStorage.setItem(STORAGE_KEY, next ? "on" : "off");
  } catch {
    // Storage unavailable: the preference is not persisted.
  }
  if (next) void getEmitter().start();
  else emitter?.stop();
  for (const listener of listeners) listener();
}

/** Restores the persisted preference. Audio stays suspended until the next gesture (autoUnlock). */
export function restore(): void {
  if (restored) return;
  restored = true;
  try {
    if (localStorage.getItem(STORAGE_KEY) === "on") setEnabled(true);
  } catch {
    // Storage unavailable: keep acoustic feedback off.
  }
}

export function onEmission(listener: (emission: EmissionEvent) => void): () => void {
  emissionListeners.add(listener);
  return () => {
    emissionListeners.delete(listener);
  };
}
```

- [ ] **Step 3: Add the toggle icon and component**

Append to `apps/docs/components/site/icons.tsx`:

```tsx
export function SoundIcon({ size = 16, muted = false }: IconProps & { muted?: boolean }): React.JSX.Element {
  return (
    <svg aria-hidden="true" fill="none" height={size} viewBox="0 0 16 16" width={size}>
      <path d="M2 6h2.5L8 3v10L4.5 10H2V6Z" fill="currentColor" />
      {muted ? (
        <path d="M11 6l4 4M15 6l-4 4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      ) : (
        <>
          <path d="M10.5 5.5a3.5 3.5 0 0 1 0 5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
          <path d="M12.5 3.5a6.5 6.5 0 0 1 0 9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
}
```

`apps/docs/components/site/acoustic-toggle.tsx`:

```tsx
"use client";

import { useEffect, useSyncExternalStore } from "react";
import { css, cx } from "styled-system/css";
import { button } from "styled-system/recipes";
import { getServerSnapshot, getSnapshot, restore, setEnabled, subscribe } from "./acoustic-feedback";
import { SoundIcon } from "./icons";

export function AcousticToggle(): React.JSX.Element {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  useEffect(() => {
    restore();
  }, []);

  return (
    <button
      aria-label="Acoustic feedback"
      aria-pressed={enabled}
      className={cx(
        button({ variant: "ghost" }),
        css({
          "&[aria-pressed=true]": { color: "primary", borderColor: "rgba(132, 204, 22, 0.5)" },
        }),
      )}
      onClick={() => setEnabled(!enabled)}
      type="button"
    >
      <SoundIcon muted={!enabled} />
      <span className={css({ display: { base: "none", md: "inline" } })}>Acoustic feedback</span>
    </button>
  );
}
```

- [ ] **Step 4: Place the toggle in the navbar**

In `apps/docs/components/site/navbar.tsx`, import the toggle and wrap the repository badge so both sit together on the right:

```tsx
import { AcousticToggle } from "./acoustic-toggle";
```

Replace the line `{/* Decorative repository badge: intentionally not a link */}` with:

```tsx
        <div className={css({ display: "flex", alignItems: "center", gap: "2" })}>
          <AcousticToggle />
          {/* Decorative repository badge: intentionally not a link */}
```

and close the wrapper right after the badge's closing `</div>` (the one before `</nav>`) with one extra `</div>`.

- [ ] **Step 5: Add the emission ripples to the hero**

In `apps/docs/panda.config.ts`, add a keyframe next to `emission`:

```ts
        ping: {
          "0%": { opacity: "1", transform: "translate(-50%, -50%) scale(0.6)" },
          "100%": { opacity: "0", transform: "translate(-50%, -50%) scale(var(--ping-scale, 4))" },
        },
```

`apps/docs/components/landing/emission-ripples.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { css } from "styled-system/css";
import { onEmission } from "../site/acoustic-feedback";

const RIPPLE_DURATION = 1600;
const MAX_RIPPLES = 6;

type Ripple = { id: number; scale: number };

/** One ring per emission, sized by its tonnage. */
export function EmissionRipples(): React.JSX.Element {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  useEffect(() => {
    let nextId = 0;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();
    const unsubscribe = onEmission((emission) => {
      const id = nextId++;
      setRipples((current) => [...current.slice(-(MAX_RIPPLES - 1)), { id, scale: 2.5 + emission.tonnage * 2.5 }]);
      const timeout = setTimeout(() => {
        timeouts.delete(timeout);
        setRipples((current) => current.filter((ripple) => ripple.id !== id));
      }, RIPPLE_DURATION);
      timeouts.add(timeout);
    });
    return () => {
      unsubscribe();
      for (const timeout of timeouts) clearTimeout(timeout);
    };
  }, []);

  return (
    <>
      {ripples.map((ripple) => (
        <span
          aria-hidden="true"
          className={css({
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "176px",
            height: "176px",
            borderWidth: "1px",
            borderColor: "rgba(163, 230, 53, 0.75)",
            borderRadius: "full",
            pointerEvents: "none",
            animation: "ping 1.6s cubic-bezier(0.2, 0.6, 0.3, 1) forwards",
            _motionReduce: { display: "none" },
          })}
          key={ripple.id}
          style={{ "--ping-scale": ripple.scale } as React.CSSProperties}
        />
      ))}
    </>
  );
}
```

In `apps/docs/components/landing/hero.tsx`, add `import { EmissionRipples } from "./emission-ripples";` and render `<EmissionRipples />` inside the logo stage, immediately after the `{["0s", "1.6s", "3.2s"].map(...)}` block of ambient ripples.

- [ ] **Step 6: Verify**

Run (from the repo root): `yarn lint && yarn typecheck && yarn build`
Expected: no errors; the build lists the same routes as before.

Run: `cd apps/docs && npx next start --port 3011` in the background, then load `http://localhost:3011` in a browser:
- the navbar shows the "Acoustic feedback" toggle, off;
- clicking it sets `aria-pressed="true"`, and scrolling plays emissions and draws green rings around the logo;
- reloading keeps the toggle on; the first click anywhere unlocks audio.

Stop the server afterwards.

- [ ] **Step 7: Commit**

```bash
git add apps/docs yarn.lock
git commit -m "feat(docs): add live acoustic feedback demo"
```

---

### Task 9: Align the documentation and landing with the shipped library

**Files:**
- Modify: `apps/docs/app/docs/page.mdx`, `apps/docs/app/docs/installation/page.mdx`, `apps/docs/app/docs/quick-start/page.mdx`, `apps/docs/app/docs/concepts/page.mdx`, `apps/docs/app/docs/accessibility/page.mdx`, `apps/docs/app/docs/ecosystem/page.mdx`, `apps/docs/app/docs/api/page.mdx`, `apps/docs/app/manifesto/page.mdx`
- Modify: `apps/docs/components/landing/hero.tsx`, `apps/docs/components/landing/features.tsx`, `apps/docs/components/landing/code-showcase.tsx`, `apps/docs/components/docs/navigation.ts`, `apps/docs/lib/site.ts`

**Interfaces:**
- Consumes: the sizes measured in Task 7 Step 6 (`TOTAL`, `STACCATO`, `SUSTAINED`, `CORE`, each formatted like `4.1 kB`).

In every step below, replace the tokens `TOTAL`, `STACCATO`, `SUSTAINED` and `CORE` with the measured values.

- [ ] **Step 1: Introduction (`app/docs/page.mdx`)**

Keep the frontmatter lines (`import { pageMetadata } …` and `export const metadata = …`) and replace everything from `# Introduction` to the end with:

````mdx
# Introduction

Pue JS is a zero-dependency, strictly typed acoustic feedback layer for the web. It observes the kinematics of a scroll container and translates them, in real time, into organic gaseous emissions — pitched, shaped and scheduled on the Web Audio clock.

It is designed for teams who believe that interfaces should be felt, not merely seen.

## What Pue JS does

Every scroll interaction carries information: direction, distance, velocity, acceleration. Most applications discard it. Pue JS captures this signal and renders it as audible feedback through a deterministic pipeline:

1. **Sampling** — scroll position is sampled once per animation frame through passive listeners.
2. **Kinematics** — instantaneous velocity is derived and smoothed with a low-pass filter.
3. **Tonnage** — velocity is mapped to intensity through a configurable tonnage curve.
4. **Selection** — an odor, a pre-decoded sample, is chosen according to tonnage.
5. **Playback** — the sample is played through Web Audio with per-emission pitch, resonance and gain.

Samples are inlined in tree-shakable modules: there are no assets to host and no network requests. The full library, odors included, weighs **TOTAL gzip**.

## Design principles

- **Determinism.** Identical scroll input produces identical acoustic output. Emissions can be snapshot-tested.
- **The main thread is sacred.** Scroll listeners are passive, sampling happens once per frame and audio is rendered on the Web Audio thread.
- **Pay for what you use.** Odors are isolated ES modules. Unused odors are eliminated at build time.
- **Consent first.** Pue JS never produces sound before an explicit user gesture and honours `prefers-reduced-motion` by default.

These principles are expanded in the [Manifesto](/manifesto).

## Browser support

Pue JS requires the Web Audio API, available in every evergreen browser.

| Browser | Minimum version |
| ------- | --------------- |
| Chrome  | 35              |
| Edge    | 79              |
| Firefox | 25              |
| Safari  | 14.1            |

In unsupported environments — including server-side rendering — `createEmitter` returns an inert emitter. Your application keeps working; it simply remains silent. Use [`isSupported()`](/docs/api#issupported) to detect this ahead of time.

## Next steps

- [Install Pue JS](/docs/installation) in your project.
- Ship your first emission with the [Quick Start](/docs/quick-start).
- Understand the runtime in [Architecture](/docs/concepts).
````

- [ ] **Step 2: Installation (`app/docs/installation/page.mdx`)**

Keep the frontmatter and replace everything from `# Installation` to the end with:

````mdx
# Installation

Pue JS is distributed as a single ESM package with bundled type definitions. It has no runtime dependencies.

## Package managers

```bash
npm install puejs
```

```bash
pnpm add puejs
```

```bash
yarn add puejs
```

```bash
bun add puejs
```

## Without a bundler

Pue JS can be loaded directly in the browser as a native ES module:

```html
<script type="module">
  import { createEmitter } from "https://cdn.jsdelivr.net/npm/puejs/+esm";

  const emitter = createEmitter(window);
  document.addEventListener("pointerdown", () => emitter.start(), { once: true });
</script>
```

## Requirements

| Requirement   | Detail                                              |
| ------------- | --------------------------------------------------- |
| Runtime       | ES2020 and the Web Audio API                        |
| TypeScript    | 5.0 or later (optional, types are bundled)          |
| Module format | ESM only                                            |
| Side effects  | None — the package is marked `"sideEffects": false` |

## Entry points

| Import path   | Contents                                                       | Size (gzip) |
| ------------- | -------------------------------------------------------------- | ----------- |
| `puejs`       | Core runtime, presets and their odors                          | TOTAL       |
| `puejs/odors` | `staccato` and `sustained`, importable individually            | STACCATO / SUSTAINED |

## Server-side rendering

Importing Pue JS on the server is safe: the package performs no work at import time. On the server, `createEmitter` returns an inert emitter whose methods are no-ops. In frameworks that distinguish client and server components, such as the Next.js App Router, instantiate emitters inside a client component.

<Callout type="note" title="Content Security Policy">
  Built-in odors are decoded from inline data and never fetched. Odors created with [`defineOdor`](/docs/api#defineodor) from a URL are fetched on `start()` and must be allowed by your `connect-src` directive.
</Callout>
````

- [ ] **Step 3: Quick Start (`app/docs/quick-start/page.mdx`)**

Replace the line `  reverb: { room: "cathedral", decay: 2.4 },` with nothing (delete it), and replace `emitter.update({ resonance: 0.4, reverb: false });` with `emitter.update({ resonance: 0.4, volume: 0.6 });`.

- [ ] **Step 4: Architecture (`app/docs/concepts/page.mdx`)**

Keep the frontmatter and replace everything from `# Architecture` to the end with:

````mdx
# Architecture

This page describes the Pue JS runtime from the moment a scroll event is observed to the moment an emission reaches the audio output. Understanding the pipeline is not required to use the library, but it will help you make informed tuning decisions.

```ts
// The emission pipeline, conceptually
scroll → sample → kinematics → tonnage → odor → voice → destination
```

## Emitters

An **emitter** is the unit of composition in Pue JS. It owns:

- a binding to one scroll container (`window` or an `Element`),
- an `AudioContext`, either private or shared through the `audioContext` option,
- a resolved acoustic profile,
- a lifecycle state.

Multiple emitters can coexist on a page — for instance, one per scrollable panel. When they share an `AudioContext`, each odor is decoded once and their output is mixed by the browser.

### Lifecycle

| State       | Meaning                                                                        |
| ----------- | ------------------------------------------------------------------------------ |
| `idle`      | Created or stopped. No listeners are attached.                                 |
| `suspended` | Observing, but the `AudioContext` is waiting for a user gesture.               |
| `running`   | Observing and emitting.                                                        |
| `destroyed` | All listeners and audio nodes released. Further calls throw `E_DESTROYED`.     |

Transitions are reported through the `statechange` event.

## Scroll sampling

Pue JS never performs work inside the scroll event itself. A passive listener flags the container as dirty; the position is read once per animation frame. The frame loop stops by itself 150 ms after the last movement.

### Velocity

Instantaneous velocity is expressed in **pixels per second** and smoothed with a low-pass filter to remove trackpad jitter. Scrolls below the `threshold` (80 px/s by default) are considered incidental and produce no emission. Frames without movement never emit.

### Throttling

The `throttle` option controls how frequently emissions may be triggered:

| Strategy     | Behaviour                                                                          |
| ------------ | ---------------------------------------------------------------------------------- |
| `"velocity"` | The minimum interval shortens from 260 ms to 60 ms as tonnage increases. Default. |
| `"distance"` | One emission every half viewport height scrolled.                                  |
| `number`     | A fixed minimum interval, in milliseconds.                                         |

## Tonnage

**Tonnage** is the perceived intensity of an emission, normalized between `0` and `1`. Velocity is first normalized between the threshold and 3000 px/s, then passed through a **tonnage curve**. Tonnage drives gain and odor selection.

Three built-in curves are provided — `"linear"`, `"logarithmic"` (default) and `"exponential"`. The logarithmic curve matches the human perception of loudness and keeps slow reading discreet while preserving headroom for aggressive flicks.

Custom curves are plain functions of the velocity:

```ts
import { createEmitter, defineTonnageCurve } from "puejs";

// Silent below 200 px/s, saturates at 3000 px/s
const gated = defineTonnageCurve((velocity) => {
  if (velocity < 200) return 0;
  return Math.min(1, (velocity - 200) / 2800);
});

createEmitter(window, { tonnage: gated });
```

## Acoustic profiles

An **acoustic profile** is the full set of parameters that shape an emission: odors, pitch range, resonance, duration, volume and tonnage curve. The `presets` export provides four calibrated profiles:

| Preset             | Character                                                  |
| ------------------ | ---------------------------------------------------------- |
| `presets.organic`  | Balanced, warm, moderate resonance. The default.           |
| `presets.crisp`    | Short, bright transients for dense, content-heavy layouts. |
| `presets.deep`     | Low pitch, long body. Suited to immersive storytelling.    |
| `presets.discreet` | Reduced gain and duration for productivity interfaces.     |

Options passed alongside `preset` are merged over it, so a preset can be refined without being redefined.

## Odors

**Odors** are the samples an emitter plays. Built-in odors live in their own ES modules under `puejs/odors` and inline their audio, so there is nothing to host.

```ts
import { createEmitter } from "puejs";
import { staccato, sustained } from "puejs/odors";

createEmitter(window, { odors: [staccato, sustained] });
```

When several odors are available, the runtime selects one per emission based on tonnage. Where ranges overlap, the choice is drawn from the emitter's seeded random source.

| Odor        | Size (gzip) | Tonnage range | Profile                    |
| ----------- | ----------- | ------------- | -------------------------- |
| `staccato`  | STACCATO    | 0 – 0.6       | Short and dry.             |
| `sustained` | SUSTAINED   | 0.4 – 1       | Rounder, with more body.   |

Your own samples can be used with [`defineOdor`](/docs/api#defineodor).

## Voices

Each emission is a short Web Audio graph: the sample's playback rate sets the pitch, a peaking filter around 180 Hz adds `resonance`, and a gain node applies the tonnage-scaled volume with a 60 ms fade-out ending at `duration`. At most six voices play at once; the oldest is stopped when the limit is reached.

## Scheduling

Motion is detected and the emission scheduled within the same animation frame. Playback starts 5 ms later on the Web Audio clock, which absorbs scheduling jitter without being perceptible. Each `emit` event exposes the measured `latency` between detection and scheduling, so you can verify it in your own telemetry.
````

- [ ] **Step 5: Accessibility (`app/docs/accessibility/page.mdx`)**

Replace the code block under `## Provide a control` (the one starting with ` ```tsx` and `"use client";`) with:

````mdx
```tsx
"use client";

import { createEmitter, type Emitter } from "puejs";
import { useEffect, useRef, useState } from "react";

export function AcousticToggle(): React.JSX.Element {
  const [enabled, setEnabled] = useState(false);
  const emitter = useRef<Emitter | null>(null);

  useEffect(() => () => emitter.current?.destroy(), []);

  const toggle = (): void => {
    emitter.current ??= createEmitter(window, { preset: "discreet" });
    if (enabled) emitter.current.stop();
    else void emitter.current.start(); // called from the click: audio is unlocked immediately
    setEnabled(!enabled);
  };

  return (
    <button aria-pressed={enabled} onClick={toggle} type="button">
      Acoustic feedback
    </button>
  );
}
```
````

Replace the paragraph under `## Background tabs` with:

```mdx
Emitters never emit while the document is hidden. No emission is ever produced for a tab the user is not looking at.
```

- [ ] **Step 6: Ecosystem (`app/docs/ecosystem/page.mdx`)**

Keep the frontmatter and replace everything from `# Framework Adapters` to the end with:

````mdx
# Framework Adapters

The core runtime is framework agnostic and works today with any framework: create the emitter in a client-side lifecycle hook and destroy it on cleanup.

## React

```tsx
"use client";

import { createEmitter } from "puejs";
import { useEffect, useRef } from "react";

export function Feed({ children }: { children: React.ReactNode }): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const emitter = createEmitter(ref.current, { preset: "crisp" });
    const start = (): void => void emitter.start();
    window.addEventListener("pointerdown", start, { once: true });
    return () => {
      window.removeEventListener("pointerdown", start);
      emitter.destroy();
    };
  }, []);

  return (
    <div ref={ref} style={{ overflowY: "auto", height: "100vh" }}>
      {children}
    </div>
  );
}
```

`destroy()` is idempotent, so the double cleanup of React Strict Mode is safe.

## Vue

```vue
<script setup lang="ts">
import { createEmitter, type Emitter } from "puejs";
import { onBeforeUnmount, onMounted, ref } from "vue";

const feed = ref<HTMLElement | null>(null);
let emitter: Emitter | null = null;

onMounted(() => {
  emitter = createEmitter(feed.value!, { preset: "organic" });
  window.addEventListener("pointerdown", () => emitter?.start(), { once: true });
});
onBeforeUnmount(() => emitter?.destroy());
</script>

<template>
  <section ref="feed" class="feed"><slot /></section>
</template>
```

## Roadmap

Official adapters are planned to remove this boilerplate:

| Module         | Status  |
| -------------- | ------- |
| `puejs/react`  | Planned |
| `puejs/vue`    | Planned |
| `puejs/svelte` | Planned |
| `puejs/solid`  | Planned |

Follow progress on [GitHub](https://github.com/ntltd/puejs).
````

In `apps/docs/components/docs/navigation.ts`, keep the entry `{ title: "Framework Adapters", href: "/docs/ecosystem" }` unchanged.

- [ ] **Step 7: API Reference (`app/docs/api/page.mdx`)**

Keep the frontmatter and replace everything from `# API Reference` to the end with:

````mdx
# API Reference

This page documents every public export of Pue JS. All signatures are written in TypeScript; the same API is available from plain JavaScript.

## Core

### `createEmitter()`

Creates an emitter bound to a scroll container.

```ts
function createEmitter(target: Window | Element, options?: EmitterOptions): Emitter;
```

| Parameter | Type                | Description                                              |
| --------- | ------------------- | -------------------------------------------------------- |
| `target`  | `Window \| Element` | The scroll container to observe.                         |
| `options` | `EmitterOptions`    | Optional configuration. Merged over the selected preset. |

Returns an [`Emitter`](#emitter) in the `idle` state. Invalid options throw `E_INVALID_OPTION`. On the server, or without Web Audio, the returned emitter is inert: its methods resolve immediately and it never emits.

```ts
import { createEmitter } from "puejs";

const emitter = createEmitter(document.querySelector("#feed")!, { preset: "crisp" });
```

### `EmitterOptions`

| Option                 | Type                               | Default                  | Description                                                    |
| ---------------------- | ---------------------------------- | ------------------------ | -------------------------------------------------------------- |
| `preset`               | `PresetName \| AcousticProfile`    | `"organic"`              | Base acoustic profile. Other options are merged over it.       |
| `odors`                | `Odor[]`                           | preset odors             | Samples available to the emitter. See [odors](#odors).         |
| `pitch`                | `number \| PitchRange`             | preset                   | Playback rate. A range is sampled per emission.                |
| `resonance`            | `number`                           | preset                   | Low-frequency body, from `0` to `1`.                           |
| `duration`             | `number`                           | preset                   | Maximum emission length in milliseconds, ending with a fade.   |
| `volume`               | `number`                           | preset                   | Master gain, from `0` to `1`.                                  |
| `tonnage`              | `TonnageCurveName \| TonnageCurve` | `"logarithmic"`          | Maps velocity to tonnage.                                      |
| `threshold`            | `number`                           | `80`                     | Minimum velocity, in px/s, required to emit.                   |
| `throttle`             | `"velocity" \| "distance" \| number` | `"velocity"`           | Emission rate strategy, or a fixed interval in milliseconds.   |
| `respectReducedMotion` | `boolean`                          | `true`                   | Stay silent when the user prefers reduced motion.              |
| `autoUnlock`           | `boolean`                          | `true`                   | Resume a suspended emitter on the next user gesture.           |
| `audioContext`         | `AudioContext`                     | private context          | Share an existing context between emitters.                    |

## Emitter

```ts
interface Emitter {
  readonly state: EmitterState;
  readonly context: AudioContext | null;
  readonly options: ResolvedOptions;

  start(): Promise<void>;
  stop(): void;
  update(options: Partial<EmitterOptions>): void;
  emit(input?: EmissionInput): void;
  on<E extends keyof EmitterEvents>(event: E, handler: (payload: EmitterEvents[E]) => void): () => void;
  off<E extends keyof EmitterEvents>(event: E, handler: (payload: EmitterEvents[E]) => void): void;
  destroy(): void;
}
```

### `start()`

Creates the audio context if needed, decodes the odors, starts observing the scroll container and resumes audio. Resolves once the emitter is `running`, or `suspended` when no user gesture is available. Calling `start()` on a started emitter is a no-op.

### `stop()`

Stops observing. In-flight emissions finish naturally. The emitter returns to `idle` and can be started again.

### `update()`

Merges new options without interrupting observation. Invalid options throw `E_INVALID_OPTION` and leave the current options untouched. `audioContext` cannot change after `start()`.

```ts
emitter.update({ preset: "deep", volume: 0.5 });
```

### `emit()`

Triggers an emission manually, independently of scroll. Ignored unless the emitter is `running`.

| Field     | Type     | Default | Description                                          |
| --------- | -------- | ------- | ---------------------------------------------------- |
| `tonnage` | `number` | `0.5`   | Intensity of the emission, from `0` to `1`.          |
| `odor`    | `Odor`   | auto    | Force a specific odor instead of automatic selection. |

### `on()` and `off()`

Subscribes to and unsubscribes from emitter events. `on()` returns an unsubscribe function.

```ts
const unsubscribe = emitter.on("emit", ({ tonnage, odor }) => {
  console.debug(`emission · ${odor} · tonnage=${tonnage.toFixed(2)}`);
});
```

### `destroy()`

Removes every listener, stops every voice and closes the private audio context, if any. Any later call throws `E_DESTROYED`, except `destroy()` and `off()`, which are safe to repeat.

## Events

```ts
interface EmitterEvents {
  emit: EmissionEvent;
  statechange: { previous: EmitterState; current: EmitterState };
  unlock: { context: AudioContext };
  error: PueError;
}
```

### `EmissionEvent`

| Field       | Type      | Description                                                  |
| ----------- | --------- | ------------------------------------------------------------ |
| `tonnage`   | `number`  | Computed tonnage, from `0` to `1`.                           |
| `velocity`  | `number`  | Smoothed scroll velocity at trigger time, in px/s.           |
| `direction` | `1 \| -1` | `1` when scrolling forward, `-1` when scrolling backward.    |
| `pitch`     | `number`  | Effective playback rate.                                     |
| `odor`      | `string`  | Name of the odor that produced the emission.                 |
| `latency`   | `number`  | Time from motion detection to scheduling, in ms.             |
| `timestamp` | `number`  | `AudioContext.currentTime` at which the emission starts.     |

## Presets

```ts
const presets: Readonly<Record<PresetName, AcousticProfile>>;
```

| Name       | Pitch       | Resonance | Duration | Volume | Odors                   |
| ---------- | ----------- | --------- | -------- | ------ | ----------------------- |
| `organic`  | 0.90 – 1.10 | 0.40      | 320 ms   | 0.8    | `staccato`, `sustained` |
| `crisp`    | 1.10 – 1.35 | 0.20      | 180 ms   | 0.8    | `staccato`              |
| `deep`     | 0.60 – 0.80 | 0.70      | 620 ms   | 0.8    | `sustained`             |
| `discreet` | 0.95 – 1.05 | 0.25      | 220 ms   | 0.4    | `staccato`              |

Presets are frozen objects. Spread them to derive your own:

```ts
import { presets, type AcousticProfile } from "puejs";

export const brand: AcousticProfile = { ...presets.organic, resonance: 0.55, duration: 360 };
```

## Tonnage curves

### `defineTonnageCurve()`

```ts
function defineTonnageCurve(curve: (velocity: number) => number): TonnageCurve;
```

The function receives the smoothed velocity in px/s and must return a value between `0` and `1`; other values are clamped. It runs once per emitting frame: keep it pure and allocation-free.

## Odors

```ts
import { staccato, sustained } from "puejs/odors";
```

### `defineOdor()`

Declares an odor from your own sample.

```ts
function defineOdor(definition: { name: string; src: string; tonnage?: [number, number] }): Odor;
```

| Field     | Type               | Description                                                         |
| --------- | ------------------ | ------------------------------------------------------------------- |
| `name`    | `string`           | Identifier reported in `EmissionEvent.odor`.                        |
| `src`     | `string`           | URL or base64 data URI of an audio file the browser can decode.     |
| `tonnage` | `[number, number]` | Tonnage range for which the odor is eligible. Default `[0, 1]`.     |

URL odors are fetched and decoded on `start()`.

## Utilities

### `isSupported()`

```ts
function isSupported(): boolean;
```

Returns `true` when the Web Audio API is available. Always `false` on the server.

### `unlock()`

```ts
function unlock(context?: AudioContext): Promise<boolean>;
```

Resumes the given audio context — or every context created by Pue JS — from within a user gesture. Resolves with `true` if playback is now allowed.

## Types

```ts
type PresetName = "organic" | "crisp" | "deep" | "discreet";

type EmitterState = "idle" | "suspended" | "running" | "destroyed";

type TonnageCurveName = "linear" | "logarithmic" | "exponential";

type ThrottleStrategy = "velocity" | "distance" | number;

interface PitchRange {
  min: number;
  max: number;
}

interface AcousticProfile {
  odors: readonly Odor[];
  pitch: number | PitchRange;
  resonance: number;
  duration: number;
  volume: number;
  tonnage: TonnageCurveName | TonnageCurve;
}
```

## Errors

Every error thrown or dispatched by Pue JS is a `PueError` with a stable `code`.

```ts
class PueError extends Error {
  readonly code: "E_DESTROYED" | "E_INVALID_OPTION" | "E_DECODE";
}
```

| Code               | When                                                                         |
| ------------------ | ---------------------------------------------------------------------------- |
| `E_DESTROYED`      | A method is called on a destroyed emitter.                                   |
| `E_INVALID_OPTION` | An option is out of range, or immutable after `start()`.                     |
| `E_DECODE`         | An odor could not be fetched or decoded. Dispatched through the `error` event; the emitter keeps running with its other odors. |
````

- [ ] **Step 8: Manifesto (`app/manifesto/page.mdx`)**

Replace `No acoustic experience justifies a dropped frame. Sampling happens once per frame. Synthesis happens on the audio thread. Scroll listeners are passive, always.` with `No acoustic experience justifies a dropped frame. Sampling happens once per frame. Audio is rendered on the audio thread. Scroll listeners are passive, always.`

Replace `The core runtime weighs 1.4 kB. It ships no audio files. It has no dependencies. Every odor, every room and every adapter is an isolated module that only exists in your bundle if you import it.` with `The full library weighs TOTAL. It inlines its audio, so there is nothing to host. It has no dependencies. Every odor is an isolated module that only exists in your bundle if you import it.`

- [ ] **Step 9: Landing**

In `apps/docs/components/landing/hero.tsx`, replace:

```tsx
            <dt>bundle</dt>
            <dd>1.4 kB gzip</dd>
          </div>
          <div>
            <dt>latency p99</dt>
            <dd>1.8 ms</dd>
```

with:

```tsx
            <dt>bundle</dt>
            <dd>TOTAL gzip</dd>
          </div>
          <div>
            <dt>scheduling</dt>
            <dd>same frame</dd>
```

In `apps/docs/components/landing/code-showcase.tsx`, delete the line `  reverb: { room: "cathedral", decay: 2.4 },` from `source`, and replace the "Framework agnostic" highlight body with `"Bind to any scroll container, from the window to a single panel. Works with every framework today."`, and replace `and the runtime handles scheduling, throttling and spatialization.` with `and the runtime handles sampling, throttling and scheduling.`

In `apps/docs/components/landing/features.tsx`:

1. In `LatencyVisual`, replace `<span>emission latency · last 32 events</span>` with `<span>scheduling delay · last 32 events</span>`, and replace `thread <span className={css({ color: "fg" })}>AudioWorklet</span>` with `clock <span className={css({ color: "fg" })}>Web Audio</span>`.
2. Replace the Low-Latency card body (`Sub-2ms trigger latency from scroll delta to audible output. A lock-free AudioWorklet pipeline schedules every emission off the main thread, keeping your INP untouched.`) with `Motion is detected and the emission scheduled within the same animation frame. Passive listeners and frame-aligned sampling keep your INP untouched.`
3. In `TreeShakingVisual`, replace the `modules` array with:

```tsx
  const modules = [
    { name: "odors/staccato", size: "STACCATO", kept: true },
    { name: "odors/sustained", size: "SUSTAINED", kept: false },
  ];
```

4. Replace the whole `ReverbVisual` function with:

```tsx
function DeterminismVisual(): React.JSX.Element {
  const runs = ["run #1", "run #2"];
  const sequence = ["0.91", "1.07", "0.96", "1.02", "0.94"];
  return (
    <div className={cx(visual, css({ display: "grid", gap: "2" }))}>
      {runs.map((run) => (
        <div
          className={css({
            display: "flex",
            alignItems: "center",
            gap: "3",
            p: "3",
            borderWidth: "1px",
            borderColor: "border",
            borderRadius: "lg",
            bg: "carbon",
          })}
          key={run}
        >
          <span className={css({ width: "14", color: "fg.subtle" })}>{run}</span>
          {sequence.map((pitch, index) => (
            <span className={css({ color: "primary" })} key={index}>
              {pitch}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}
```

5. Replace the last card (label `spatial`, title `Convolution Reverberation`) with:

```tsx
          <article className={cx(card, css({ gridColumn: { lg: "span 2" } }))}>
            <span className={cardLabel}>determinism</span>
            <h3 className={cardTitle}>Deterministic Emissions</h3>
            <p className={cardBody}>
              Pitch variation and odor selection are drawn from a seeded generator. Identical scroll input produces
              identical acoustic output, so your acoustic layer can be snapshot-tested.
            </p>
            <DeterminismVisual />
          </article>
```

- [ ] **Step 10: Verify**

Run: `grep -rnE "reverb|Reverb|AudioWorklet|workletUrl|tremolo|infrasonic|cathedral|puejs/react|usePue|PueProvider|1\.4 kB|E_WORKLET_LOAD|E_IMPULSE_FETCH" apps/docs/app apps/docs/components`
Expected: matches only in `apps/docs/app/rfcs/` (the RFC describes future work) and the "Planned" table of the Ecosystem page (`puejs/react`).

Run: `grep -rnE "\b(TOTAL|STACCATO|SUSTAINED|CORE)\b" apps/docs/app apps/docs/components`
Expected: no matches (every token replaced).

Run (repo root): `npx prettier --write "apps/docs/**/*.{ts,tsx,mdx}" && yarn lint && yarn typecheck && yarn build`
Expected: no errors.

Start `npx next start --port 3011` in `apps/docs`, open `/`, `/docs`, `/docs/concepts`, `/docs/api` and `/docs/ecosystem`, and check that the pages render with the new content. Stop the server.

- [ ] **Step 11: Commit**

```bash
git add apps/docs
git commit -m "docs: align documentation and landing with the shipped library"
```

---

## Final verification

- [ ] Run `yarn test && yarn lint && yarn typecheck && yarn build` from the repo root. Expected: all green.
- [ ] Report to the user: branch `feat/puejs-library`, commits made, measured sizes, and that nothing was pushed or published.
