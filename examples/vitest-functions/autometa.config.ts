import { defineConfig } from "@autometa/core/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["../.features"],
      steps: ["./src/steps", "./src/step-definitions.ts"],
      parameterTypes: ["./src/support/parameter-types.ts"],
    },
    events: ["./src/support/autometa.events.ts"],
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
