import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    alias: {
      find: "@cucumber/tag-expressions",
      replacement: "@cucumber/tag-expressions/dist/esm/index.js",
    },
    coverage: {
      provider: "v8", // or 'v8'
      reporter: ["html", "json", "json-summary"],
    },
  },
});
