import { defineConfig } from "tsup";

export default defineConfig({
  format: ["cjs", "esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
});
