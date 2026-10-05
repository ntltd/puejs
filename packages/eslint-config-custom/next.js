import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import turbo from "eslint-config-turbo/flat";

/*
 * Shared ESLint flat config for Next.js apps.
 * Extends Next.js core-web-vitals + TypeScript rules and Turborepo env checks.
 */
export default [
  ...nextVitals,
  ...nextTs,
  ...turbo,
  {
    ignores: ["node_modules/", ".next/", "out/", "dist/", "styled-system/"],
  },
];
