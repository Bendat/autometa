import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@autometa/cucumber-expressions": resolve(
        workspaceRoot,
        "packages/cucumber-expressions/src"
      ),
      "@autometa/scopes": resolve(workspaceRoot, "packages/scopes/src"),
      "@autometa/config": resolve(workspaceRoot, "packages/config/src"),
      "@autometa/executor": resolve(workspaceRoot, "packages/executor/src"),
      "@autometa/gherkin": resolve(workspaceRoot, "packages/gherkin/src"),
      "@autometa/coordinator": resolve(workspaceRoot, "packages/coordinator/src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 83,
        branches: 69,
        functions: 84,
        statements: 83,
      },
    },
  },
});
