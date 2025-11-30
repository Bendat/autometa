import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  entry: ["src/index.ts", "src/register.ts"],
  tsconfig: "./tsconfig.bundle.json",
  dts: false, // Emit declarations with tsc after bundling for consistent outputs.
  external: ["@playwright/test"],
});
