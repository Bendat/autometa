import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["src/index.ts"],
      thresholds: {
        lines: 90,
        branches: 80,
        functions: 90,
        statements: 90,
      },
    },
  },
});
