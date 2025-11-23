import { defineConfig } from "vitest/config";
import { autometa } from "@autometa/vitest-plugins";

export default defineConfig({
  plugins: [autometa()],
  test: {
    globals: true,
    environment: "node",
    passWithNoTests: true,
    include: ["**/*.feature"],
  },
  optimizeDeps: {
    include: ["@cucumber/gherkin", "@cucumber/cucumber-expressions"]
  },
  ssr: {
    noExternal: ["@cucumber/cucumber-expressions"],
    external: ["@cucumber/gherkin"]
  }
});
