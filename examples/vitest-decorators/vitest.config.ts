import { defineConfig } from "vitest/config";
import { autometa } from "@autometa/vitest-plugins";

export default defineConfig({
  plugins: [autometa()],
  test: {
    environment: "node",
    globals: false,
    include: ["features/**/*.feature"],
    sequence: {
      concurrent: false,
    },
    hookTimeout: 30_000,
    testTimeout: 30_000,
    clearMocks: true,
    server: {
      deps: {
        external: [/node_modules/],
      },
    },
  },
});
