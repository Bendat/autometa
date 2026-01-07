import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      // Reuse the shared reference features, but run only the scenarios this
      // package implements.
      features: [
        "../.features/http/http-client.feature",
        "../.features/http/lifecycle-hooks.feature",
      ],
      steps: ["./src/step-definitions.ts", "./src/steps/**/*.steps.ts"],
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
