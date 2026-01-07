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
        "src/apps/brew-buddy": ["api"],
      },
    },
  },
});
