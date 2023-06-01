import { defineConfig } from "tsup";

export default defineConfig({
  clean: true, // clean up the dist folder
  // dts: true, // generate dts files
  format: ["cjs", "esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
});
