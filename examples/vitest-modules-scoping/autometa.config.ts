import { defineConfig } from "@autometa/core";

const hoistedScope = process.env.AUTOMETA_HOISTED_SCOPE === "directory" ? "directory" : "tag";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["src/features/**/*.feature"],
      steps: [
        "src/autometa/root.steps.ts",
        "src/groups/**/autometa.steps.ts",
      ],
    },
    modules: {
      stepScoping: "scoped",
      hoistedFeatures: {
        scope: hoistedScope,
        strict: true,
      },
      relativeRoots: {
        steps: ["steps/**/*.steps.ts"],
      },
      groups: {
        api: {
          root: "src/groups/api",
          modules: ["example", "other"],
        },
      },
    },
  },
});

