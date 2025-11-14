import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.build.json",
  dts: false, // Use tsc post-build to emit declarations into dist/
});
