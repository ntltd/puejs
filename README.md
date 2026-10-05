# Pue JS

Acoustic Scroll Events for the modern web.

## Stack

- [Turborepo](https://turborepo.com) monorepo (yarn workspaces)
- `apps/docs`: landing page — [Next.js 16](https://nextjs.org) (App Router, Turbopack), React 19
- Styling: [Panda CSS 2](https://panda-css.com) (design tokens + recipes in `apps/docs/panda.config.ts`)
- `packages/eslint-config-custom`: shared ESLint 9 flat config (`eslint-config-next` + `eslint-config-turbo`)
- `packages/tsconfig`: shared `tsconfig.json`s (TypeScript 6)

## Requirements

Node.js 22+ (see `.nvmrc`), Yarn 1.22.

## Scripts

```sh
yarn install    # also runs `panda codegen` (generates apps/docs/styled-system)
yarn dev        # docs on http://localhost:3001
yarn build
yarn lint
yarn typecheck
yarn format
```
