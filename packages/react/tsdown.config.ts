import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts" },
  format: "esm",
  dts: true,
  platform: "neutral",
  target: "es2022",
  clean: true,
  // Client-only hooks: lets the Next.js App Router import the adapter from server components.
  banner: { js: '"use client";' },
});
