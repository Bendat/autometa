import { defineWorkspace } from "vitest/config";

export default defineWorkspace([
  "packages/*",
  {
    test: {
      environment: "node",
      exclude: ["**/node_modules/**", "**/dist/**", "__examples__/**", "__integration__/**"],
    },
  },
]);
