import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8", // or 'v8'
      reporter: ["json-summary", "json"],
      thresholds: {
        lines: 76,
        branches: 67,
        functions: 86,
        statements: 76,
      },
    },
  },
});
