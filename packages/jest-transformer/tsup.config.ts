import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.bundle.json",
  dts: false, // Emit declarations with tsc after bundling for consistent outputs.
  external: ["jest"],
});
