import type { Options } from "tsup";
export const tsup: Options = {
  clean: true, // clean up the dist folder
  format: ["cjs", "esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  dts: true,
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
};
