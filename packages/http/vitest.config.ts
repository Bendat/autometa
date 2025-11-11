import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "src/**/__test__/**/*.test.ts",
      "test/**/*.test.ts",
      "integration/**/*.test.ts",
    ],
    exclude: ["**/.reference/**"],
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
