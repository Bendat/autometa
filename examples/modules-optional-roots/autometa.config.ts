import { defineConfig } from "@autometa/core";

export default defineConfig({
  default: {
    runner: "vitest",
    modules: {
      stepScoping: "scoped",
      relativeRoots: {
        features: [".features/**/*.feature"],
        steps: [
          // Pull in the group environment (shared across all backoffice modules).
          "../autometa.steps.ts",
          // Pull in module-level step definitions.
          "steps/**/*.steps.ts",
        ],
      },
      groups: {
        backoffice: {
          root: "src/groups/backoffice",
          modules: ["reports", "orders"],
        },
      },
    },
  },
});
