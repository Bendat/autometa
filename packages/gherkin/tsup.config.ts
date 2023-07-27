import { defineConfig } from "tsup";

export default defineConfig({
  clean: true, // clean up the dist folder
  sourcemap: false, // generate sourcemaps
  format: ["cjs", "esm"], // generate cjs and esm files
  dts: true,
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
});
