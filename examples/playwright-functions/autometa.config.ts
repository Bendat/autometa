import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "playwright",
    roots: {
      features: ["../.features"],
      steps: ["./src/steps", "./src/autometa/steps.ts"],
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
