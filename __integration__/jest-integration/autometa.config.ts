import { defineConfig } from "@autometa/runner";
defineConfig({
  runner: "jest",
  environment: "default",
  test: {
    groupLogging: true
  },
  events: [],
  roots: {
    features: ["__integration__/features"],
    steps: ["__integration__/steps"],
    app: ["src"]
  },
  shim: {
    errorCause: true
  }
  // test: {
  //   timeout: 10000
  //   // tagFilter: "@integration"
  // },
});
