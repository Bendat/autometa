import { defineConfig } from "@autometa/core/config";

export default defineConfig({
  default: {
    runner: "jest",
    roots: {
      features: ["./features"],
      steps: ["./src/step-definitions.ts"],
    },
  },
});
