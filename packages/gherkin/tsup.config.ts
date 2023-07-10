import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: true,
  format: ["cjs", "esm"], // generate cjs and esm files
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"]
});
