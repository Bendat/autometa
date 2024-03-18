import { defineConfig } from "vitest/config";

export default defineConfig({
  // root: "src",
  plugins: [],
  test: {
    // root: "src",
    setupFiles: ["reflect-metadata"],
    coverage: {
      provider: "istanbul", // or 'v8'
      reporter: ["html"]
    }
  },
});
