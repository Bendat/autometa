import type { Options } from "tsup";
export const tsup: Options = {
  clean: true, // clean up the dist folder
  format: ["cjs", "esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["index.ts"],
  target: "es2020",
  outDir: "dist",
  dts: true,
  legacyOutput: false,
  external: ["dist"],
};
