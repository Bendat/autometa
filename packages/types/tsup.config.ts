import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  entryPoints: ["src/index.ts"],
  dts: false, // Declarations emitted via tsc --project tsconfig.types.json
});
