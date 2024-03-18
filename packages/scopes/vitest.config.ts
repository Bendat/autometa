import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["reflect-metadata"],
    coverage: {
      provider: "v8", // or 'v8'
    },
  },
});
