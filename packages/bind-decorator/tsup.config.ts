import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.bundle.json",
  dts: false, // Emit declarations via tsc post-build for consistency.
});
