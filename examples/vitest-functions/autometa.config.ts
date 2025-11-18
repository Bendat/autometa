import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["../.features"],
      steps: ["./src/steps"],
      parameterTypes: ["./src/support/parameter-types.ts"],
    },
    test: {
      timeout: [30, "s"],
    },
  },
});
