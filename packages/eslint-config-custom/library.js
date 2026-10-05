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
