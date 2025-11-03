import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  dts: false, // Declarations come from tsc --project tsconfig.types.json
  // Package-specific overrides can go here
  // external: ["some-package-specific-external"]
});
