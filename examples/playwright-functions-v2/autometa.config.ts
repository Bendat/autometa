import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "playwright",
    roots: {
      features: [],
      steps: [],
    },
    modules: {
      relativeRoots: {
        features: [".features"],
        steps: ["steps"],
      },
      groups: {
        "brew-buddy": {
          root: "src/apps/brew-buddy",
          modules: ["api"],
        },
      },
    },
  },
});
