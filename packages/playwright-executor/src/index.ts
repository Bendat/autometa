/**
 * Playwright Executor for Autometa
 *
 * Provides an ExecutorRuntime that maps Playwright's test primitives
 * to the common Autometa execution interface.
 */

import type { ExecutorConfig } from "@autometa/config";
import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type { TestPlan } from "@autometa/test-builder";
import type { ExecutorRuntime, SuiteFn, TestFn } from "@autometa/executor";
import { registerFeaturePlan } from "@autometa/executor";
import { test } from "@playwright/test";

// Re-export for convenience
export { test, expect } from "@playwright/test";

/**
 * Create an ExecutorRuntime for Playwright.
 *
 * Playwright has a different structure than Vitest/Jest:
 * - test.describe() for suites
 * - test() for tests
 * - test.beforeAll(), test.afterAll(), test.beforeEach(), test.afterEach() for hooks
 */
function createPlaywrightRuntime(): ExecutorRuntime {
  // Create suite function with skip/only variants
  const baseSuite = function suite(
    title: string,
    handler: () => void,
    _timeout?: number
  ): void {
    test.describe(title, handler);
  };

  const skipSuite = function skip(
    title: string,
    handler: () => void,
    _timeout?: number
  ): void {
    test.describe.skip(title, handler);
  };

  const onlySuite = function only(
    title: string,
    handler: () => void,
    _timeout?: number
  ): void {
    test.describe.only(title, handler);
  };

  // Build the suite object with circular references
  const suite = Object.assign(baseSuite, {
    skip: Object.assign(skipSuite, {
      skip: skipSuite as SuiteFn,
      only: onlySuite as SuiteFn,
    }),
    only: Object.assign(onlySuite, {
      skip: skipSuite as SuiteFn,
      only: onlySuite as SuiteFn,
    }),
  }) as SuiteFn;

  // Create test function with skip/only variants
  const baseTest = function testFn(
    title: string,
    handler: () => void | Promise<void>,
    timeout?: number
  ): void {
    if (timeout) {
      test(title, async () => {
        test.setTimeout(timeout);
        await handler();
      });
    } else {
      test(title, handler);
    }
  };

  const skipTest = function skip(
    title: string,
    handler: () => void | Promise<void>,
    _timeout?: number
  ): void {
    test.skip(title, handler);
  };

  const onlyTest = function only(
    title: string,
    handler: () => void | Promise<void>,
    timeout?: number
  ): void {
    if (timeout) {
      test.only(title, async () => {
        test.setTimeout(timeout);
        await handler();
      });
    } else {
      test.only(title, handler);
    }
  };

  const todoTest = function todo(title: string, _reason?: string): void {
    // Playwright doesn't have native todo, use skip
    test.skip(title, () => undefined);
  };

  // Build the test object with circular references
  const testFn = Object.assign(baseTest, {
    skip: Object.assign(skipTest, {
      skip: skipTest as TestFn,
      only: onlyTest as TestFn,
    }),
    only: Object.assign(onlyTest, {
      skip: skipTest as TestFn,
      only: onlyTest as TestFn,
    }),
    todo: todoTest,
  }) as TestFn;

  return {
    suite,
    test: testFn,
    beforeAll: (handler, timeout) => {
      test.beforeAll(async () => {
        if (timeout) {
          test.setTimeout(timeout);
        }
        await handler();
      });
    },
    afterAll: (handler, timeout) => {
      test.afterAll(async () => {
        if (timeout) {
          test.setTimeout(timeout);
        }
        await handler();
      });
    },
    beforeEach: (handler, timeout) => {
      test.beforeEach(async () => {
        if (timeout) {
          test.setTimeout(timeout);
        }
        await handler();
      });
    },
    afterEach: (handler, timeout) => {
      test.afterEach(async () => {
        if (timeout) {
          test.setTimeout(timeout);
        }
        await handler();
      });
    },
    currentTestName: () => {
      // Playwright doesn't expose current test name the same way
      // Return undefined for now
      return undefined;
    },
    retry: (_count: number) => {
      // Playwright handles retries at config level, not per-test
      // This is a no-op
    },
    warn: (message: string) => {
      console.warn(message);
    },
    logError: (error: Error) => {
      console.error(error);
    },
  };
}

/**
 * The default Playwright runtime instance.
 */
export const playwrightRuntime: ExecutorRuntime = createPlaywrightRuntime();

/**
 * Options for executing a feature with Playwright.
 */
export interface ExecuteOptions<World> {
  readonly plan: TestPlan<World>;
  readonly adapter: ScopeExecutionAdapter<World>;
  readonly config: ExecutorConfig;
}

/**
 * Execute a feature test plan using Playwright.
 *
 * This is the main entry point for the generated bridge code.
 */
export function execute<World>(options: ExecuteOptions<World>): void {
  registerFeaturePlan({
    plan: options.plan,
    adapter: options.adapter,
    config: options.config,
    runtime: playwrightRuntime,
  });
}

export default { execute, playwrightRuntime };
