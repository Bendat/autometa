import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      "@autometa/errors": resolve(workspaceRoot, "packages/errors/src"),
      "@autometa/config": resolve(workspaceRoot, "packages/config/src"),
      "@autometa/scopes": resolve(workspaceRoot, "packages/scopes/src"),
      "@autometa/gherkin": resolve(workspaceRoot, "packages/gherkin/src"),
      "@autometa/test-builder": resolve(workspaceRoot, "packages/test-builder/src"),
      "@autometa/executor": resolve(workspaceRoot, "packages/executor/src"),
    },
  },
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 85,
        branches: 43,
        functions: 62,
        statements: 85,
      },
    },
  },
});
