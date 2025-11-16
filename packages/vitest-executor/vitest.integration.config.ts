import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (relativePath: string) => path.resolve(__dirname, relativePath);
const resolveGherkinDependency = (dependency: string) =>
  path.resolve(__dirname, "../gherkin/node_modules", dependency);

export default defineConfig({
  test: {
    include: ["integration/**/*.test.ts"],
    coverage: {
      enabled: false,
    },
  },
  resolve: {
    alias: {
      "@autometa/config": resolveFromRoot("../config/src/index.ts"),
      "@autometa/executor": resolveFromRoot("../executor/src/index.ts"),
      "@autometa/gherkin": resolveFromRoot("../gherkin/src/index.ts"),
      "@autometa/scopes": resolveFromRoot("../scopes/src/index.ts"),
      "@autometa/test-builder": resolveFromRoot("../test-builder/src/index.ts"),
      "@cucumber/gherkin": resolveGherkinDependency("@cucumber/gherkin"),
      "@cucumber/messages": resolveGherkinDependency("@cucumber/messages"),
      "@cucumber/tag-expressions": resolveGherkinDependency("@cucumber/tag-expressions"),
      uuid: resolveGherkinDependency("uuid"),
    },
  },
});
