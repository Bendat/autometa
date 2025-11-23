import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  external: [
    "@autometa/test-builder",
    "@autometa/gherkin",
    "@autometa/config",
    "@autometa/errors",
    "@autometa/scopes",
    "@cucumber/cucumber-expressions",
    "@cucumber/tag-expressions"
  ],
  tsconfig: "./tsconfig.build.json",
  clean: true,
  dts: false,
});
