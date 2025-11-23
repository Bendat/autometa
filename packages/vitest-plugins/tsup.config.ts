import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  dts: false, // Emit declarations with tsc after bundling for consistent outputs.
  // Package-specific overrides can go here
  // external: ["some-package-specific-external"]
});
