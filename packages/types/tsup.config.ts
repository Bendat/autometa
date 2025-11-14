import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.build.json",
entryPoints: ["src/index.ts"],
  dts: false, // Declarations emitted via tsc --project tsconfig.types.json
});
