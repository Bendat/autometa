import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  format: ["cjs", "esm"],
  dts: false, // Declarations emitted via tsc --project tsconfig.types.json
  sourcemap: true,
  skipNodeModulesBundle: true,
  entryPoints: ["src/index.ts"],
  target: "es2020",
  outDir: "dist",
  legacyOutput: true,
  external: ["dist"],
});
