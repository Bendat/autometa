import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/index.ts", "**/.eslintrc.cjs"],
      thresholds: {
        lines: 74,
        branches: 68,
        functions: 77,
        statements: 74,
      },
    },
  },
});
