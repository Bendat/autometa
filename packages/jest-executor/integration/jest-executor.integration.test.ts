import { describe, expect as vitestExpect, it, vi } from "vitest";

import { defineConfig, type PartialExecutorConfig } from "@autometa/config";
import { parseGherkin } from "@autometa/gherkin";
import {
  createExecutionAdapter,
  createScopes,
  type ScopeExecutionAdapter,
} from "@autometa/scopes";
import { buildTestPlan, type TestPlan } from "@autometa/test-builder";

interface CalculatorWorld {
  numbers: number[];
  result?: number;
}

interface PlanContext {
  readonly plan: TestPlan<CalculatorWorld>;
  readonly adapter: ScopeExecutionAdapter<CalculatorWorld>;
  readonly worlds: CalculatorWorld[];
  readonly scenarioName: string;
}

function createExecutorConfig(overrides?: PartialExecutorConfig) {
  const config = defineConfig({
    default: {
      runner: "jest",
      roots: {
        features: ["features"],
        steps: ["steps"],
      },
    },
    ...(overrides
      ? {
          environments: {
            integration: overrides,
          },
        }
      : {}),
  });

  return config.current(overrides ? { environment: "integration" } : undefined);
}

function createCalculatorPlan(options: {
  readonly featureTitle: string;
  readonly scenarioTitle: string;
  readonly scenarioTags?: readonly string[];
  readonly gherkinScenarioTags?: readonly string[];
  readonly operands?: readonly [number, number];
  readonly expectedSum?: number;
}): PlanContext {
  const worlds: CalculatorWorld[] = [];
  const scopes = createScopes<CalculatorWorld>({
    worldFactory: (_context) => {
      const world: CalculatorWorld = { numbers: [] };
      if (_context.scope.kind === "scenario") {
        worlds.push(world);
      }
      return world;
    },
  });

  const { feature, scenario, given, when, then, plan } = scopes;
  const operands = options.operands ?? [2, 3];
  const expectedSum = options.expectedSum ?? operands[0] + operands[1];
  const [firstOperand, secondOperand] = operands;

  feature({ title: options.featureTitle }, () => {
    scenario(
      options.scenarioTitle,
      options.scenarioTags && options.scenarioTags.length > 0
        ? { tags: [...options.scenarioTags] }
        : undefined,
      () => {
        given(`two numbers ${firstOperand} and ${secondOperand}`, (world) => {
          world.numbers = [firstOperand, secondOperand];
        });

        when("they are added", (world) => {
          const [first, second] = world.numbers;
          world.result = first + second;
        });

        then(`the sum is ${expectedSum}`, (world) => {
          if (world.result !== expectedSum) {
            throw new Error(
              `Expected sum to be ${expectedSum} but received ${world.result}`
            );
          }
        });
      }
    );
  });

  const adapter = createExecutionAdapter(plan());

  const scenarioTagLine =
    options.gherkinScenarioTags && options.gherkinScenarioTags.length > 0
      ? `  ${options.gherkinScenarioTags
          .map((tag) => (tag.startsWith("@") ? tag : `@${tag}`))
          .join(" ")}`
      : undefined;

  const featureSource = [
    `Feature: ${options.featureTitle}`,
    ...(scenarioTagLine ? [scenarioTagLine] : []),
    `  Scenario: ${options.scenarioTitle}`,
    `    Given two numbers ${firstOperand} and ${secondOperand}`,
    "    When they are added",
    `    Then the sum is ${expectedSum}`,
    "",
  ].join("\n");

  const simpleFeature = parseGherkin(featureSource);
  const planResult = buildTestPlan({ feature: simpleFeature, adapter });

  return {
    plan: planResult,
    adapter,
    worlds,
    scenarioName: options.scenarioTitle,
  };
}

type AnyFn = (...args: readonly unknown[]) => unknown;

async function withFakeJestGlobals<T>(handler: () => Promise<T>): Promise<T> {
  const g = globalThis as unknown as Record<string, unknown>;

  const original = {
    describe: g.describe,
    it: g.it,
    beforeAll: g.beforeAll,
    afterAll: g.afterAll,
    beforeEach: g.beforeEach,
    afterEach: g.afterEach,
    expect: g.expect,
    jest: g.jest,
  };

  const tests: Array<{ name: string; fn: AnyFn }> = [];
  const beforeAlls: AnyFn[] = [];
  const afterAlls: AnyFn[] = [];
  const beforeEaches: AnyFn[] = [];
  const afterEaches: AnyFn[] = [];

  let currentTestName: string | undefined;

  g.describe = (_name: string, fn: AnyFn) => {
    fn();
  };

  type FakeIt = ((name: string, fn: AnyFn) => void) & {
    skip: (_name: string, _fn?: AnyFn) => void;
    todo: (_name: string, _reason?: string) => void;
  };

  const fakeIt = ((name: string, fn: AnyFn) => {
    tests.push({ name, fn });
  }) as FakeIt;
  fakeIt.skip = (_name: string, _fn?: AnyFn) => {
    // Intentionally ignored for this harness.
  };
  fakeIt.todo = (_name: string, _reason?: string) => {
    // Intentionally ignored for this harness.
  };
  g.it = fakeIt;

  g.beforeAll = (fn: AnyFn) => {
    beforeAlls.push(fn);
  };
  g.afterAll = (fn: AnyFn) => {
    afterAlls.push(fn);
  };
  g.beforeEach = (fn: AnyFn) => {
    beforeEaches.push(fn);
  };
  g.afterEach = (fn: AnyFn) => {
    afterEaches.push(fn);
  };

  g.expect = {
    getState: () => ({ currentTestName }),
  };
  g.jest = undefined;

  try {
    const result = await handler();

    for (const fn of beforeAlls) {
      // eslint-disable-next-line no-await-in-loop
      await fn();
    }

    for (const test of tests) {
      currentTestName = test.name;
      for (const fn of beforeEaches) {
        // eslint-disable-next-line no-await-in-loop
        await fn();
      }
      // eslint-disable-next-line no-await-in-loop
      await test.fn();
      for (const fn of afterEaches) {
        // eslint-disable-next-line no-await-in-loop
        await fn();
      }
    }

    for (const fn of afterAlls) {
      // eslint-disable-next-line no-await-in-loop
      await fn();
    }

    return result;
  } finally {
    g.describe = original.describe;
    g.it = original.it;
    g.beforeAll = original.beforeAll;
    g.afterAll = original.afterAll;
    g.beforeEach = original.beforeEach;
    g.afterEach = original.afterEach;
    g.expect = original.expect;
    g.jest = original.jest;
  }
}

describe("jest-executor integration (vitest harness)", () => {
  it("registers and executes plans via a Jest-like runtime", async () => {
    const { passingPlan, filteredPlan } = await withFakeJestGlobals(async () => {
      // Import after globals are in place so the executor captures them.
      vi.resetModules();
      const { execute } = await import("../src");

      const passingPlan = createCalculatorPlan({
        featureTitle: "Calculator execution",
        scenarioTitle: "adds numbers",
      });

      execute({
        plan: passingPlan.plan,
        adapter: passingPlan.adapter,
        config: createExecutorConfig(),
      });

      const filteredPlan = createCalculatorPlan({
        featureTitle: "Filtered calculator",
        scenarioTitle: "remains pending when filtered",
        scenarioTags: ["skip-me"],
        gherkinScenarioTags: ["skip-me"],
      });

      execute({
        plan: filteredPlan.plan,
        adapter: filteredPlan.adapter,
        config: createExecutorConfig({ test: { tagFilter: "@run" } }),
      });

      return { passingPlan, filteredPlan };
    });

    const executed = passingPlan.plan
      .listExecutables()
      .find((candidate) => candidate.name === passingPlan.scenarioName);

    vitestExpect(executed?.result.status).toBe("passed");
    vitestExpect(passingPlan.worlds).toHaveLength(1);
    vitestExpect(passingPlan.worlds[0]).toMatchObject({ numbers: [2, 3], result: 5 });

    const filtered = filteredPlan.plan
      .listExecutables()
      .find((candidate) => candidate.name === filteredPlan.scenarioName);

    vitestExpect(filtered?.result.status).toBe("pending");
    vitestExpect(filteredPlan.worlds).toHaveLength(0);
  });
});
