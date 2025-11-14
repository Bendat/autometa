import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  tsconfig: "./tsconfig.build.json",
  dts: false, // Declarations are emitted by the dedicated tsc build step
  // Keep runtime dependencies external so consumers resolve their own copies
  external: ["@cucumber/gherkin", "@cucumber/messages", "uuid"]
});
