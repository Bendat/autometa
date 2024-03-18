import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "cucumber/cucumber-runner",
  test: {
    coverage: {
      provider: "istanbul", // or 'v8'
      reporter: ["html"],
    },
  },
});
