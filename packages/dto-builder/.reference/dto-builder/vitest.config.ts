import { defineConfig } from "vitest/config";

export default defineConfig({
  // root: "src",
  plugins: [],
  test: {
    // root: "src",
    setupFiles: ["reflect-metadata"],
    coverage: {
      provider: "v8", // or 'v8'
      reporter: ["json-summary", "json"],
    },
  },
});
