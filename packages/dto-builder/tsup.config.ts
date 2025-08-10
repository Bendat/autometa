import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  entryPoints: ["src/index.ts"],
  external: [
    "any-date-parser",
    "class-validator",
    "closest-match"
  ],
  skipNodeModulesBundle: false
});
