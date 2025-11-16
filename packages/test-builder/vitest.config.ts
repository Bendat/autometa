import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const workspaceRoot = path.resolve(
  path.dirname(fileURLToPath(new URL(import.meta.url))),
  ".."
);

const resolveWorkspace = (...segments: string[]): string =>
  path.resolve(workspaceRoot, ...segments);

export default defineConfig({
  resolve: {
    alias: {
      "@autometa/cucumber-expressions": resolveWorkspace(
        "cucumber-expressions",
        "src",
        "index.ts"
      ),
    },
  },
  test: {
    exclude: [
      "**/node_modules/**",
      "**/.pnpm/**",
      "**/.reference/**",
      "**/dist/**",
    ],
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
