import { defineConfig } from "vitest/config";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  test: {
    include: ["src/**/*.{test,spec}.ts"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/build/**", "**/coverage/**"],
    globals: true,
  },
  resolve: {
    alias: {
      "@autometa/config": resolve(__dirname, "../config/src/index.ts"),
      "@autometa/runner": resolve(__dirname, "../runner/src/index.ts"),
      "@autometa/gherkin": resolve(__dirname, "../gherkin/src/index.ts"),
    },
  },
});
