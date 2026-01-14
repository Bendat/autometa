import { defineConfig } from "@autometa/core";

export default defineConfig({
  default: {
    runner: "playwright",
    roots: {
      features: ["../.features"],
      steps: ["./src/autometa/steps.ts", "./src/steps/**/*.steps.*"],
      parameterTypes: ["./src/autometa/parameter-types.ts"],
    },
    test: {
      timeout: [30, "s"],
    },
    logging: {
      http: true,
    },
    reporting: {
      hierarchical: {
        bufferOutput: false,
      },
    },
  },
});
