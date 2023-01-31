// import { TestGroup, TestCall, Hook } from "./gherkin-feature";

import { TestGroup, Hook, TestCall } from "./types";

export interface TestFunctions {
  describe: TestGroup;
  test: TestCall;
  beforeAll: Hook;
  afterAll: Hook;
  beforeEach: Hook;
  afterEach: Hook;
}
