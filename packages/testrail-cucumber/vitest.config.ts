import { defineConfig } from "vitest/config";

export default defineConfig({
  root: __dirname,
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/dist/**", "**/build/**", "**/coverage/**", "**/node_modules/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "json"],
      include: ["src/**"],
      exclude: ["dist/**", "build/**", "coverage/**", "node_modules/**", "../../documentation/**"],
      thresholds: {
        statements: 0,
        branches: 0,
        functions: 0,
        lines: 0,
      }
    },
  },
});
