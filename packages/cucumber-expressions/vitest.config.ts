import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/index.ts", "**/.eslintrc.cjs"],
      thresholds: {
        lines: 87,
        branches: 52,
        functions: 75,
        statements: 87,
      },
    },
  },
});
