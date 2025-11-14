import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@jest/globals": "vitest",
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
