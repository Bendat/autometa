import { defineConfig } from "vitest/config";

export default defineConfig({
  // root: "src",
  plugins: [],
  test: {
    setupFiles: ["reflect-metadata"],
    coverage: {
      provider: "v8", // or 'v8'
      reporter: ["html", "json", "json-summary"],
    },
  },
});
