# Contributing to Pue JS

Thanks for lending an ear. Bug reports, new odors, docs fixes and adapters for other frameworks are all welcome.

## Before you start

- **Bugs**: open an [issue](https://github.com/ntltd/puejs/issues) with the browser, the package version and a minimal reproduction (the [playground](https://www.puejs.org/playground) is a good place to start).
- **Features and API changes**: open an issue first so we can agree on the shape before you write code.
- **Small fixes** (typos, docs, obvious bugs): send a pull request directly.

## Setup

Requires Node.js 22+ (`nvm use` picks the version from `.nvmrc`) and Yarn 1.22.

```sh
git clone git@github.com:ntltd/puejs.git
cd puejs
yarn install
yarn dev        # builds the packages, then serves the docs on http://localhost:3001
```

## Where things live

| Path             | What                                                        |
| ---------------- | ----------------------------------------------------------- |
| `packages/puejs` | `@puejs/core`: emitter, presets, tonnage curves, throttling |
| `packages/react` | `@puejs/react`: `usePue` and `PueProvider`                  |
| `apps/docs`      | www.puejs.org: landing, docs (MDX), playground, RFCs        |

Run a task in a single workspace with `yarn workspace <name> <task>`, for example `yarn workspace @puejs/core test`.

## Making changes

1. Branch off `main`.
2. Add or update tests next to your change (`packages/*/test`). The core tests run against Web Audio fakes in `test/fakes.ts`, so no browser is needed.
3. If you change the public API or its behaviour, update the package README and the matching page in `apps/docs/app/docs`.
4. Before pushing, make sure everything passes:

   ```sh
   yarn build
   yarn test
   yarn lint
   yarn typecheck
   yarn format
   ```

### Bundle size

`@puejs/core` has zero dependencies and every odor is opt-in. Keep it that way. After a build, check what each import costs:

```sh
yarn workspace @puejs/core size
```

Mention any noticeable increase in your pull request.

### Odors

Samples live in `packages/puejs/assets` and are inlined into `packages/puejs/src/odors/*.ts`. Never edit the generated files by hand:

1. Add the source `.mp3` to `assets/`.
2. Declare it in `scripts/encode-odors.ts` (name, source file and tonnage range).
3. Regenerate with `yarn workspace @puejs/core encode-odors` (requires [ffmpeg](https://ffmpeg.org)).
4. Export it from `src/odors/index.ts`. New odors are opt-in: do not add them to presets.

## Commits and pull requests

Commits follow [Conventional Commits](https://www.conventionalcommits.org), with the workspace as scope when it helps:

```
feat(docs): show the file name and language on doc code blocks
feat: add the @puejs/react adapter (#3)
chore: publish the library as @puejs/core
```

Write the subject in the imperative, lowercase, without a trailing period. Keep pull requests focused on one change and describe what you tested.

## Releases

`@puejs/core` and `@puejs/react` are published to npm by the maintainer. You don't need to bump versions in your pull request.

## License

By contributing, you agree that your contributions are released into the public domain under the [Unlicense](./LICENSE).
