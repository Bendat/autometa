import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  root: "cucumber/cucumber-runner",
  plugins: [tsconfigPaths({})],
  test: {
  },
});
