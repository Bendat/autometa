import type { Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts", "e2e/**/*.spec.ts"],
  dts: true,
  outDir: "dist",
  sourcemap: false, // generate sourcemaps
  format: ["iife", "cjs", "esm"],
  shims: true,
  clean: true,
  // bundle: false,
  external: ["node_modules"],
};

export default config;
