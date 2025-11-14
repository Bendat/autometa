import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.build.json",
  dts: false, // Declarations emitted via dedicated tsc build step
  // Package-specific overrides can go here
  // external: ["some-package-specific-external"]
});
