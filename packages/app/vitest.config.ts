import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/index.ts", "src/internal/default-dsl.ts", "**/.eslintrc.cjs"],
      thresholds: {
        lines: 87,
        branches: 75,
        functions: 76,
        statements: 87,
      },
    },
  },
});
