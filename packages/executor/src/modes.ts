import type { ExecutionMode } from "@autometa/scopes";
import type { SuiteFn, TestFn } from "./types";

export const selectSuiteByMode = (suite: SuiteFn, mode: ExecutionMode): SuiteFn => {
  switch (mode) {
    case "skip":
      return suite.skip;
    case "only":
      return suite.only;
    default:
      return suite;
  }
};

export const selectTestByMode = (test: TestFn, mode: ExecutionMode): TestFn => {
  switch (mode) {
    case "skip":
      return test.skip;
    case "only":
      return test.only;
    default:
      return test;
  }
};
