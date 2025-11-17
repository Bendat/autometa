import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["../.features"],
      steps: ["./src/steps"],
      support: ["./src/support/bootstrap.ts"],
    },
    test: {
      timeout: [30, "s"],
    },
  },
});
