import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 66,
        branches: 90,
        functions: 74,
        statements: 66,
      },
    },
  },
});
