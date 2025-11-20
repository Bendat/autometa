import { describe, expect, it, vi } from "vitest";
import { buildTestPlan } from "../build-test-plan";
import { TestPlanBuilder } from "../internal/test-plan-builder";
import { createExecutionAdapter, createScopes } from "../../../scopes/src";
import type { ScopeExecutionAdapter, ScopeNode } from "../../../scopes/src/types";
import type { ScenarioExecution } from "../types";
import type {
  SimpleCompiledScenario,
  SimpleExampleGroup,
  SimpleFeature,
  SimpleRule,
  SimpleScenario,
  SimpleScenarioOutline,
  SimpleStep,
} from "../../../gherkin/src";

interface TestWorld {
  readonly output?: unknown;
}

type ExampleRow = readonly string[];

function createStep(id: string, keyword: string, text: string): SimpleStep {
  return {
    id,
    keyword,
    text,
    location: { line: 1, column: 1 },
  };
}

function createScenario(id: string, name: string, steps: SimpleStep[]): SimpleScenario {
  return {
    id,
    keyword: "Scenario",
    name,
    description: "",
    tags: [],
    steps,
    location: { line: 1, column: 1 },
  };
}

function createRule(
  id: string,
  name: string,
  elements: readonly (SimpleScenario | SimpleScenarioOutline)[]
): SimpleRule {
  return {
    id,
    keyword: "Rule",
    name,
    description: "",
    tags: [],
    elements: [...elements],
    location: { line: 1, column: 1 },
  };
}

function createExampleGroup(id: string, rows: readonly ExampleRow[]): SimpleExampleGroup {
  const [header = [] as string[], ...bodyRows] = rows.map((row) => [...row]);
  return {
    id,
    keyword: "Examples",
    name: "dataset",
    description: "",
    tags: ["@examples"],
    tableHeader: header,
    tableBody: bodyRows,
    location: { line: 1, column: 1 },
  };
}

function createCompiledScenario(
  id: string,
  name: string,
  exampleIndex: number,
  exampleGroupId: string,
  scenarioOutlineId: string,
  steps: SimpleStep[]
): SimpleCompiledScenario {
  return {
    id,
    keyword: "Scenario",
    name,
    description: "",
    tags: ["@outline"],
    steps,
    exampleIndex,
    exampleGroupId,
    scenarioOutlineId,
  };
}

describe("buildTestPlan", () => {
  it("produces execution metadata for feature level scenarios", () => {
    const noop = vi.fn();
    const scopes = createScopes<TestWorld>();
    const { feature, scenario, given, when, then } = scopes;

    feature("Calculator feature", () => {
      scenario("adds two numbers", () => {
        given(/two numbers/, noop);
        when(/they are added/, noop);
        then(/the sum is produced/, noop);
      });
    });

    const plan = scopes.plan();
    const adapter = createExecutionAdapter(plan);

    const simpleScenario = createScenario("scenario-1", "adds two numbers", [
      createStep("step-1", "Given", "two numbers"),
      createStep("step-2", "When", "they are added"),
      createStep("step-3", "Then", "the sum is produced"),
    ]);

    const featureNode: SimpleFeature = {
      id: "feature-1",
      keyword: "Feature",
      language: "en",
      name: "Calculator feature",
      description: "",
      tags: ["@critical"],
      elements: [simpleScenario],
      comments: [],
      location: { line: 1, column: 1 },
    };

    const testPlan = buildTestPlan({ feature: featureNode, adapter });

    expect(testPlan.feature.scenarios).toHaveLength(1);
    const [scenarioExecution] = testPlan.listExecutables();
    expect(scenarioExecution.name).toBe("adds two numbers");
    expect(scenarioExecution.gherkinSteps).toHaveLength(3);
    expect(scenarioExecution.steps).toHaveLength(3);
    expect(scenarioExecution.tags).toContain("@critical");
    expect(scenarioExecution.qualifiedName).toContain("Feature: Calculator feature");
    expect(scenarioExecution.qualifiedName).toContain("Scenario: adds two numbers");

    scenarioExecution.markPassed();
    expect(scenarioExecution.result.status).toBe("passed");
    scenarioExecution.markFailed(new Error("boom"));
    expect(scenarioExecution.result.status).toBe("failed");
    scenarioExecution.reset();
    expect(scenarioExecution.result.status).toBe("pending");
  });

  it("compiles rule contained scenarios and outlines", () => {
    const noop = vi.fn();
    const scopes = createScopes<TestWorld>();
    const { feature, rule, scenario: addScenario, scenarioOutline, given, when, then } = scopes;

    feature({ name: "Rule based feature", tags: ["@feature"] }, () => {
      rule("business logic", () => {
        addScenario("adds numbers in rule", () => {
          given(/a rule precondition/, noop);
          when(/an action occurs/, noop);
          then(/a rule assertion passes/, noop);
        });
        scenarioOutline({
          name: "outline flow",
          tags: ["@outline"],
          examples: [
            {
              name: "dataset",
              description: "",
              tags: ["@examples"],
              table: [
                ["value"],
                ["A"],
                ["B"],
              ],
            },
          ],
        }, () => {
          given(/^a (.+)$/i, noop);
        });
      });
    });

    const plan = scopes.plan();
    const adapter = createExecutionAdapter(plan);

    const ruleScenario = createScenario("rule-scenario", "adds numbers in rule", [
      createStep("step-1", "Given", "a rule precondition"),
      createStep("step-2", "When", "an action occurs"),
      createStep("step-3", "Then", "a rule assertion passes"),
    ]);

    const exampleGroup = createExampleGroup("examples-1", [
      ["value"],
      ["A"],
      ["B"],
    ]);

    const outlineSteps = [createStep("outline-step", "Given", "a <value>")];

    const outline: SimpleScenarioOutline = {
      id: "outline-1",
      keyword: "Scenario Outline",
      name: "outline flow",
      description: "",
      tags: ["@outline"],
      steps: outlineSteps,
      exampleGroups: [exampleGroup],
      compiledScenarios: [
        createCompiledScenario(
          "compiled-1",
          "outline flow (A)",
          0,
          "examples-1",
          "outline-1",
          [createStep("compiled-step-1", "Given", "a A")]
        ),
        createCompiledScenario(
          "compiled-2",
          "outline flow (B)",
          1,
          "examples-1",
          "outline-1",
          [createStep("compiled-step-2", "Given", "a B")]
        ),
      ],
      location: { line: 1, column: 1 },
    };

    const ruleElement: SimpleRule = createRule("rule-1", "business logic", [ruleScenario, outline]);

    const ruleFeature: SimpleFeature = {
      id: "feature-rule",
      keyword: "Feature",
      language: "en",
      name: "Rule based feature",
      description: "",
      tags: ["@feature"],
      background: undefined,
      elements: [ruleElement],
      comments: [],
      location: { line: 1, column: 1 },
    };

    const testPlan = buildTestPlan({ feature: ruleFeature, adapter });

    expect(testPlan.feature.rules).toHaveLength(1);
    const [ruleNode] = testPlan.feature.rules;
    expect(ruleNode.name).toBe("business logic");
    expect(ruleNode.scenarios).toHaveLength(1);
    expect(ruleNode.scenarioOutlines).toHaveLength(1);

    const [scenarioExecution] = ruleNode.scenarios;
    expect(scenarioExecution.tags).toContain("@feature");
    expect(scenarioExecution.tags).not.toContain("@outline");

    const [outlineNode] = ruleNode.scenarioOutlines;
    expect(outlineNode.examples).toHaveLength(2);
    const [firstExample] = outlineNode.examples;
    const exampleData = firstExample.data?.example as
      | { readonly values?: Record<string, string> }
      | undefined;
    expect(exampleData?.values).toEqual({ value: "A" });
    expect(testPlan.listExecutables()).toHaveLength(3);
  });

  it("throws when scenarios lack matching scope summaries", () => {
    const scopes = createScopes<TestWorld>();
    const { feature, scenario } = scopes;
    feature("Mismatch feature", () => {
      scenario("expected name", vi.fn());
    });

    const plan = scopes.plan();
    const adapter = createExecutionAdapter(plan);

    const mismatchedFeature: SimpleFeature = {
      id: "mismatch",
      keyword: "Feature",
      language: "en",
      name: "Mismatch feature",
      description: "",
      tags: [],
      elements: [createScenario("scenario-1", "different name", [])],
      comments: [],
      location: { line: 1, column: 1 },
    };

    expect(() => buildTestPlan({ feature: mismatchedFeature, adapter })).toThrow(
      /Could not find a registered scenario scope/
    );
  });

  it("fails when registered scopes remain unmatched after building", () => {
    const scopes = createScopes<TestWorld>();
    const { feature, scenario } = scopes;
    feature("Partial feature", () => {
      scenario("covered", vi.fn());
      scenario("unmatched", vi.fn());
    });

    const plan = scopes.plan();
    const adapter = createExecutionAdapter(plan);

    const simpleScenario = createScenario("scenario-covered", "covered", []);

    const partialFeature: SimpleFeature = {
      id: "feature-partial",
      keyword: "Feature",
      language: "en",
      name: "Partial feature",
      description: "",
      tags: [],
      elements: [simpleScenario],
      comments: [],
    };

    expect(() => buildTestPlan({ feature: partialFeature, adapter })).toThrow(
      /were not matched to Gherkin nodes/
    );
  });

  it("throws when registerExecution receives duplicate scenario identifiers", () => {
    const featureScope: ScopeNode<TestWorld> = {
      id: "feature-scope",
      kind: "feature",
      name: "Collision feature",
      mode: "default",
      tags: [],
      steps: [],
      hooks: [],
      children: [],
    };

    const adapter: ScopeExecutionAdapter<TestWorld> = {
      plan: {
        root: {
          id: "root",
          kind: "root",
          name: "root",
          mode: "default",
          tags: [],
          steps: [],
          hooks: [],
          children: [],
        },
        stepsById: new Map(),
        hooksById: new Map(),
        scopesById: new Map(),
      },
      features: [featureScope],
      async createWorld(_scope) {
        return {};
      },
      getScope() {
        return undefined;
      },
      getSteps() {
        return [];
      },
      getHooks() {
        return [];
      },
      getAncestors() {
        return [];
      },
      listScenarios() {
        return [];
      },
      getParameterRegistry() {
        return undefined;
      },
    };

    const feature: SimpleFeature = {
      id: "feature-colliding",
      keyword: "Feature",
      language: "en",
      name: "Collision feature",
      description: "",
      tags: [],
      elements: [],
      comments: [],
      location: { line: 1, column: 1 },
    };

    const builder = new TestPlanBuilder<TestWorld>(feature, featureScope, adapter);
    const registrar = builder as unknown as {
      registerExecution(execution: ScenarioExecution<TestWorld>): void;
    };

    const createExecutionStub = (id: string, qualifiedName: string) =>
      ({ id, qualifiedName } as unknown as ScenarioExecution<TestWorld>);

    registrar.registerExecution(createExecutionStub("dup-id", "Scenario: first"));
    expect(() =>
      registrar.registerExecution(createExecutionStub("dup-id", "Scenario: second"))
    ).toThrow(/Duplicate scenario identifier/);
  });

  it("throws when registerExecution receives duplicate qualified names", () => {
    const featureScope: ScopeNode<TestWorld> = {
      id: "feature-scope",
      kind: "feature",
      name: "Duplicate names",
      mode: "default",
      tags: [],
      steps: [],
      hooks: [],
      children: [],
    };

    const adapter: ScopeExecutionAdapter<TestWorld> = {
      plan: {
        root: {
          id: "root",
          kind: "root",
          name: "root",
          mode: "default",
          tags: [],
          steps: [],
          hooks: [],
          children: [],
        },
        stepsById: new Map(),
        hooksById: new Map(),
        scopesById: new Map(),
      },
      features: [featureScope],
      async createWorld(_scope) {
        return {};
      },
      getScope() {
        return undefined;
      },
      getSteps() {
        return [];
      },
      getHooks() {
        return [];
      },
      getAncestors() {
        return [];
      },
      listScenarios() {
        return [];
      },
      getParameterRegistry() {
        return undefined;
      },
    };

    const feature: SimpleFeature = {
      id: "feature-qualified",
      keyword: "Feature",
      language: "en",
      name: "Duplicate names",
      description: "",
      tags: [],
      elements: [],
      comments: [],
      location: { line: 1, column: 1 },
    };

    const builder = new TestPlanBuilder<TestWorld>(feature, featureScope, adapter);
    const registrar = builder as unknown as {
      registerExecution(execution: ScenarioExecution<TestWorld>): void;
    };

    const createExecutionStub = (id: string, qualifiedName: string) =>
      ({ id, qualifiedName } as unknown as ScenarioExecution<TestWorld>);

    registrar.registerExecution(createExecutionStub("first-id", "Scenario: duplicate"));
    expect(() =>
      registrar.registerExecution(createExecutionStub("second-id", "Scenario: duplicate"))
    ).toThrow(/Duplicate qualified scenario name/);
  });
});
