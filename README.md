# Pue JS

Acoustic Scroll Events for the modern web.

Documentation: [www.puejs.org](https://www.puejs.org)

## Packages

| Package                            | Description                                               |
| ---------------------------------- | --------------------------------------------------------- |
| [`@puejs/core`](./packages/puejs)  | The library: zero dependencies, Web Audio, strictly typed |
| [`@puejs/react`](./packages/react) | React adapter (`usePue`, `PueProvider`)                   |

```sh
npm install @puejs/core
npm install @puejs/core @puejs/react # with React 18 or 19
```

See each package's README for usage.

## Repository

- [Turborepo](https://turborepo.com) monorepo (Yarn workspaces)
- `packages/puejs`: `@puejs/core`, built with [tsdown](https://tsdown.dev), tested with [Vitest](https://vitest.dev)
- `packages/react`: `@puejs/react`, same tooling
- `apps/docs`: landing page, docs and playground — [Next.js 16](https://nextjs.org) (App Router, Turbopack), React 19, MDX
- Styling: [Panda CSS 2](https://panda-css.com) (design tokens + recipes in `apps/docs/panda.config.ts`)
- `packages/eslint-config-custom`: shared ESLint 9 flat config
- `packages/tsconfig`: shared `tsconfig.json`s (TypeScript 6)

## Requirements

Node.js 22+ (24 in `.nvmrc`), Yarn 1.22.

## Scripts

```sh
yarn install    # also runs `panda codegen` (generates apps/docs/styled-system)
yarn dev        # builds the packages, then serves the docs on http://localhost:3001
yarn build
yarn test
yarn lint
yarn typecheck
yarn format
```

## Environment

| Variable               | Purpose                                                                        |
| ---------------------- | ------------------------------------------------------------------------------ |
| `NEXT_PUBLIC_SITE_URL` | Overrides the absolute site URL used for canonical links and Open Graph images |

Defaults to `https://www.puejs.org` in production builds and `http://localhost:3001` in development.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

Released into the public domain under the [Unlicense](./LICENSE).
