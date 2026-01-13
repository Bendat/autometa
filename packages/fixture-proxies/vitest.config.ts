import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/index.ts", "**/.eslintrc.cjs"],
      thresholds: {
        lines: 90,
        branches: 76,
        functions: 90,
        statements: 90,
      },
    },
  },
});
