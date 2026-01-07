import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "vitest",
    roots: {
      features: ["src/features/**/*.feature"],
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
          modules: [
            "reports",
            {
              name: "orders",
              submodules: ["cancellations"],
            },
          ],
        },
      },
    },
  },
  environments: {
    hoisted: {
      roots: {
        // Hoisted features + hoisted steps only (no grouped step roots)
        features: ["src/features/**/*.feature"],
        steps: ["src/hoisted/steps.ts"],
      },
      // Keep groups as a registry if desired, but do not expand anything.
      modules: {
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
  },
});
