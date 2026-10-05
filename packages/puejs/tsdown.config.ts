import { defineConfig } from "tsdown";

export default defineConfig({
  entry: { index: "src/index.ts", "odors/index": "src/odors/index.ts" },
  format: "esm",
  dts: true,
  platform: "neutral",
  target: "es2020",
  clean: true,
});
