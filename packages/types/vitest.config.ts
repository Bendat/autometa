import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    root: "src",
    setupFiles: ["reflect-metadata"],
    coverage: {
      provider: "istanbul" // or 'v8'
    }
  },
});
