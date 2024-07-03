import { defineConfig } from "@autometa/runner";
import './src/foo.param'
defineConfig({
  runner: "jest",
  environment: "default",
  test: {
    groupLogging: true,
  },
  events: [],
  roots: {
    features: ["__integration__/features"],
    steps: ["__integration__/steps"],
    app: ["src"],
    parameterTypes: ["**/*/*.param.ts"],
  },
  shim: {
    errorCause: true,
  },
});
