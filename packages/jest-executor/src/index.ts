import type { ExecutorConfig } from "@autometa/config";
import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type { TestPlan } from "@autometa/test-builder";

import type { ExecutorRuntime } from "@autometa/executor";
import { registerFeaturePlan } from "@autometa/executor";

declare const describe: ExecutorRuntime["suite"];
declare const it: ExecutorRuntime["test"];
declare const beforeAll: ExecutorRuntime["beforeAll"];
declare const afterAll: ExecutorRuntime["afterAll"];
declare const beforeEach: ExecutorRuntime["beforeEach"];
declare const afterEach: ExecutorRuntime["afterEach"];
declare const expect: { getState(): { currentTestName?: string } };
declare const jest: { retryTimes?(count: number): void } | undefined;

const runtime: ExecutorRuntime = {
  suite: describe,
  test: it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  currentTestName: () => expect.getState().currentTestName,
  retry: (count: number) => {
    if (typeof jest?.retryTimes === "function") {
      jest.retryTimes(count);
    }
  },
  warn: (message: string) => {
    console.warn(message);
  },
  logError: (error: Error) => {
    console.error(error);
  },
};

export interface ExecuteOptions<World> {
  readonly plan: TestPlan<World>;
  readonly adapter: ScopeExecutionAdapter<World>;
  readonly config: ExecutorConfig;
}

export function execute<World>(options: ExecuteOptions<World>): void {
  registerFeaturePlan({
    plan: options.plan,
    adapter: options.adapter,
    config: options.config,
    runtime,
  });
}

export default { execute };