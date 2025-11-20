import { afterAll, expect } from "vitest";
import { defineConfig, type PartialExecutorConfig } from "@autometa/config";
import { parseGherkin } from "@autometa/gherkin";
import {
  createExecutionAdapter,
  createScopes,
  type ScopeExecutionAdapter,
} from "@autometa/scopes";
import { buildTestPlan, type TestPlan } from "@autometa/test-builder";
import { execute } from "../src";

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
      runner: "vitest",
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
      worlds.push(world);
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

afterAll(() => {
  const executed = passingPlan.plan
    .listExecutables()
    .find((candidate) => candidate.name === passingPlan.scenarioName);

  expect(executed?.result.status).toBe("passed");
  expect(passingPlan.worlds).toHaveLength(1);
  expect(passingPlan.worlds[0]).toMatchObject({ numbers: [2, 3], result: 5 });

  const filtered = filteredPlan.plan
    .listExecutables()
    .find((candidate) => candidate.name === filteredPlan.scenarioName);

  expect(filtered?.result.status).toBe("pending");
  expect(filteredPlan.worlds).toHaveLength(0);
});
