import { defineConfig } from "@autometa/runner";
defineConfig({
  runner: "jest",
  environment: "default",
  test: {
    groupLogging: true,
    timeout: 10000,
  },
  events: [],
  roots: {
    features: ["integration/features"],
    steps: ["integration/steps"],
    app: ["src"],
    parameterTypes: ["*.params.ts"],
  },
  shim: {
    errorCause: true,
  },
});
