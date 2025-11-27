import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.bundle.json",
  entryPoints: ["src/index.ts"],
  dts: false, // Declarations emitted by tsc --project tsconfig.types.json
  external: [
    "any-date-parser",
    "class-validator",
    "closest-match"
  ]
});
