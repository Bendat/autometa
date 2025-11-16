import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "vitest/config";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const resolveFromRoot = (relativePath: string) => path.resolve(__dirname, relativePath);
const resolveGherkinDependency = (dependency: string) =>
  path.resolve(__dirname, "../gherkin/node_modules", dependency);

export default defineConfig({
  resolve: {
    alias: {
      "@jest/globals": "vitest",
      "@autometa/gherkin": resolveFromRoot("../gherkin/src/index.ts"),
      "@cucumber/gherkin": resolveGherkinDependency("@cucumber/gherkin"),
      "@cucumber/messages": resolveGherkinDependency("@cucumber/messages"),
      "@cucumber/tag-expressions": resolveGherkinDependency("@cucumber/tag-expressions"),
      uuid: resolveGherkinDependency("uuid"),
    },
  },
  test: {
    globals: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 90,
        branches: 90,
        functions: 90,
        statements: 90,
      },
    },
  },
});
