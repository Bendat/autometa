import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export default defineConfig({
  resolve: {
    alias: {
      "@autometa/gherkin": resolve(workspaceRoot, "packages/gherkin/src"),
      "@autometa/scopes": resolve(workspaceRoot, "packages/scopes/src"),
      "@autometa/config": resolve(workspaceRoot, "packages/config/src"),
    },
  },
  test: {
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
