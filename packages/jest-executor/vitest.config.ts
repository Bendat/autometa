import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      thresholds: {
        lines: 49,
        branches: 33,
        functions: 14,
        statements: 49,
      },
    },
  },
});
