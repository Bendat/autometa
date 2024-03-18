import { defineConfig } from "vitest/config";

export default defineConfig({
  root: "cucumber/cucumber-runner",
  test: {
    coverage: {
      provider: "v8", // or 'v8'
      reporter: ["json-summary", "json"],
    },
  },
});
