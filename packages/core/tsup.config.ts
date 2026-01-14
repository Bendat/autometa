import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.bundle.json",
  dts: false,
  entryPoints: [
    "src/index.ts",
    "src/assert.ts",
    "src/http.ts",
    "src/config.ts",
    "src/cucumber.ts",
    "src/gherkin.ts",
    "src/executor.ts",
    "src/scopes.ts",
    "src/injection.ts",
    "src/phrases.ts",
    "src/types.ts",
    "src/errors.ts",
    "src/status-codes.ts",
    "src/datetime.ts",
    "src/dto.ts",
    "src/bind.ts",
    "src/runner.ts",
    "src/bin.ts",
  ],
});
