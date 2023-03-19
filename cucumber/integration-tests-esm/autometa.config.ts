import { defineConfig } from "@autometa/cucumber-runner";
import {
  test,
  describe,
  beforeAll,
  beforeEach,
  afterAll,
  afterEach,
} from "@jest/globals";
import { Subscriber } from "./src/subscriber";

defineConfig({
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
  // subscribers: [Subscriber],
});
