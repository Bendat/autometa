import type { Options } from "tsup";
export const tsup: Options = {
  clean: true, // clean up the dist folder
  dts: true, // generate .d.ts bundle
  sourcemap: false, // generate sourcemaps
  format: ["cjs", "esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
};
