import { defineConfig } from "tsup";

export default defineConfig({
  clean: true, // clean up the dist folder
  format: ["esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
  sourcemap: false, // generate sourcemaps
});
