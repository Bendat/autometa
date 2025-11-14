import type { ExecutorConfig } from "@autometa/config";
import type { ScopeExecutionAdapter } from "@autometa/scopes";
import type { TestPlan } from "@autometa/test-builder";

import type { ExecutorRuntime } from "@autometa/executor";
import { registerFeaturePlan } from "@autometa/executor";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

const runtime: ExecutorRuntime = {
  suite: describe as ExecutorRuntime["suite"],
  test: it as ExecutorRuntime["test"],
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
  currentTestName: () => expect.getState().currentTestName,
  retry: (count: number) => {
    const retry = (it as typeof it & { retry?: (attempts: number) => void }).retry;
    if (typeof retry === "function") {
      retry(count);
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
