import { defineConfig } from "tsup";

export default defineConfig({
  clean: true, // clean up the dist folder
  format: ["cjs", "esm"], // generate cjs and esm files
  dts: true,
  sourcemap: true, // generate sourcemaps
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
});
