import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: [],
      steps: ["src/autometa/steps.ts"],
    },
    modules: {
      relativeRoots: {
        features: [".features/**/*.feature"],
        steps: ["steps/**/*.steps.ts"],
      },
      groups: {
        "brew-buddy": {
          root: "src/groups/brew-buddy",
          modules: ["menu", "orders"],
        },
        backoffice: {
          root: "src/groups/backoffice",
          modules: ["reports", "orders"],
        },
      },
    },
  },
});
