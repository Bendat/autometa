import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  dts: false, // Declarations emitted via dedicated tsc build step
  // Package-specific overrides can go here
  // external: ["some-package-specific-external"]
});
