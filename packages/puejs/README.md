# Pue JS

Next-generation acoustic feedback for modern web applications. Zero-dependency, strictly typed, purely organic scroll interactions.

Documentation: [www.puejs.org](https://www.puejs.org)

## Install

```sh
npm install @puejs/core
```

## Usage

```ts
import { createEmitter } from "@puejs/core";

const emitter = createEmitter(window, { preset: "organic" });

// Browsers only allow audio after a user gesture.
button.addEventListener("click", () => emitter.start());
```

Scrolling above 80 px/s now triggers emissions whose pitch and gain follow the scroll velocity.

## Options

| Option                 | Default         | Description                                               |
| ---------------------- | --------------- | --------------------------------------------------------- |
| `preset`               | `"organic"`     | `organic`, `crisp`, `deep`, `discreet` or a full profile  |
| `odors`                | preset odors    | Samples available to the emitter                          |
| `pitch`                | preset          | Playback rate, or a `{ min, max }` range                  |
| `resonance`            | preset          | Low-frequency body, from 0 to 1                           |
| `duration`             | preset          | Maximum emission length in milliseconds                   |
| `volume`               | preset          | Master gain, from 0 to 1                                  |
| `tonnage`              | `"logarithmic"` | Velocity to intensity curve, or a custom function         |
| `threshold`            | `80`            | Minimum velocity in px/s                                  |
| `throttle`             | `"velocity"`    | `"velocity"`, `"distance"` or an interval in milliseconds |
| `respectReducedMotion` | `true`          | Stay silent when the user prefers reduced motion          |
| `autoUnlock`           | `true`          | Resume blocked audio on the next user gesture             |
| `audioContext`         | private         | Share an existing `AudioContext`                          |

## Odors

Built-in samples are inlined, so there is nothing to host. Presets use `staccato` and `sustained`; `soprano`, `pesante`, `sforzando`, `fortissimo` and `cathedral` are opt-in and only bundled when imported:

```ts
import { createEmitter } from "@puejs/core";
import { cathedral, fortissimo, pesante, sforzando, soprano, staccato, sustained } from "@puejs/core/odors";

createEmitter(window, {
  odors: [staccato, sustained, soprano, pesante, sforzando, fortissimo, cathedral],
  duration: 2600, // fortissimo lasts 2.5 s
});
```

Use your own samples with `defineOdor`:

```ts
import { createEmitter, defineOdor } from "@puejs/core";

const custom = defineOdor({ name: "custom", src: "/sounds/custom.mp3", tonnage: [0.3, 1] });
createEmitter(window, { odors: [custom] });
```

## License

Released into the public domain under the [Unlicense](./LICENSE).
