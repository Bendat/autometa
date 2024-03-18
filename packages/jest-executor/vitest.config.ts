import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      find: "@cucumber/tag-expressions",
      replacement: "@cucumber/tag-expressions/dist/esm/index.js",
    },
    coverage: {
      provider: "istanbul", // or 'v8'
      reporter: ["html"],
    },
  },
});
