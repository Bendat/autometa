import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/index.ts", "**/.eslintrc.cjs"],
      thresholds: {
        lines: 89,
        branches: 84,
        functions: 90,
        statements: 89,
      },
    },
  },
});
