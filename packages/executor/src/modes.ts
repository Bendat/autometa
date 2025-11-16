import type { ExecutionMode } from "@autometa/scopes";
import type { SuiteFn, TestFn } from "./types";

const MODE_TAG_ALIASES: Record<string, ExecutionMode> = {
  concurrent: "concurrent",
  failing: "failing",
  fails: "failing",
};

function normalizeTagValue(tag: string): string {
  return tag.replace(/^@/, "").trim().toLowerCase();
}

function wrapFailingTest(test: TestFn): TestFn {
  const failing = ((title: string, handler: () => void | Promise<void>, timeout?: number) => {
    const wrapped = async () => {
      let threw = false;
      try {
        await handler();
      } catch (_error) {
        threw = true;
        return;
      }

      if (!threw) {
        throw new Error("Expected scenario to fail, but it passed");
      }
    };

    test(title, wrapped, timeout);
  }) as TestFn;

  failing.skip = test.skip;
  failing.only = test.only;
  if (typeof test.concurrent === "function") {
    failing.concurrent = test.concurrent;
  }
  failing.failing = failing;
  failing.fails = failing;

  return failing;
}

function selectFailingTest(test: TestFn): TestFn {
  if (typeof test.failing === "function") {
    return test.failing;
  }
  if (typeof test.fails === "function") {
    return test.fails;
  }
  return wrapFailingTest(test);
}

export const selectSuiteByMode = (suite: SuiteFn, mode: ExecutionMode): SuiteFn => {
  switch (mode) {
    case "skip":
      return suite.skip;
    case "only":
      return suite.only;
    case "concurrent":
      return typeof suite.concurrent === "function" ? suite.concurrent : suite;
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
    case "concurrent":
      return typeof test.concurrent === "function" ? test.concurrent : test;
    case "failing":
      return selectFailingTest(test);
    default:
      return test;
  }
};

export const resolveModeFromTags = (
  currentMode: ExecutionMode,
  tags: readonly string[] | undefined
): ExecutionMode => {
  if (currentMode !== "default") {
    return currentMode;
  }

  if (!tags || tags.length === 0) {
    return currentMode;
  }

  for (const tag of tags) {
    const normalized = normalizeTagValue(tag);
    const derived = MODE_TAG_ALIASES[normalized];
    if (derived) {
      return derived;
    }
  }

  return currentMode;
};
