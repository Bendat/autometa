import { createTsupConfig } from "tsup-config";

export default createTsupConfig({
  entryPoints: ["src/index.ts"],
  // Keep all dependencies external - don't bundle them
  external: [
    "@cucumber/gherkin",
    "@cucumber/messages", 
    "uuid"
  ],
  // Don't skip node modules bundling to ensure our code is included
  skipNodeModulesBundle: false
});
