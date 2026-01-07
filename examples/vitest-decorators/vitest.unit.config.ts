import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: false,
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/*.feature"],
    sequence: {
      concurrent: false,
    },
    hookTimeout: 30_000,
    testTimeout: 30_000,
    clearMocks: true,
  },
});
