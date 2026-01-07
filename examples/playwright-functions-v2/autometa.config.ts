import { defineConfig } from "@autometa/config";

export default defineConfig({
  default: {
    runner: "playwright",
    roots: {
      features: [],
      steps: [],
    },
    modules: ["src/apps/brew-buddy/api"],
    moduleRelativeRoots: {
      features: [".features"],
      steps: ["steps"],
    },
  },
});
