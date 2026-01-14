import { defineConfig } from "@autometa/core";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["./features"],
      steps: ["./src/steps/index.ts"],
    },
    test: {
      timeout: [30, "s"],
    },
  },
});
