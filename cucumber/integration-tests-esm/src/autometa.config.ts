import { defineConfig, AllureSubscriber } from "@autometa/cucumber-runner";
import {
  test,
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "@jest/globals";
import { App } from "./app";

defineConfig({
  app: App,
  globalsRoot: "globals",
  featuresRoot: "test",
  runner: {
    name: "jest",
    test,
    describe,
    beforeAll,
    beforeEach,
    afterAll,
    afterEach,
  },
  subscribers: [AllureSubscriber],
});
