import { defineConfig } from "vitest/config";
import { autometa } from "@autometa/vitest-plugins";

export default defineConfig({
  plugins: [autometa()],
  test: {
    environment: "node",
    globals: false,
    include: ["../.features/**/*.feature"],
    sequence: {
      concurrent: false,
    },
    hookTimeout: 30_000,
    testTimeout: 30_000,
    clearMocks: true,
    server: {
      deps: {
        // Externalize all node_modules - don't try to bundle them
        // This makes vitest resolve modules from node_modules at runtime
        external: [/node_modules/],
      },
    },
  },
});
