import { describe, expect, it } from "vitest";
import type {
  ScenarioSummary,
  ScopeNode,
  StepDefinition,
} from "../../../../scopes/src/types";
import type {
  SimpleCompiledScenario,
  SimpleExampleGroup,
  SimpleFeature,
  SimpleScenario,
  SimpleScenarioOutline,
  SimpleStep,
} from "../../../../gherkin/src";
import {
  createFeatureNode,
  createRuleNode,
  createScenarioNode,
  createScenarioOutlineExample,
  createScenarioOutlineNode,
} from "../../internal/nodes";
import type {
  RuleNode,
  ScenarioExecution,
  ScenarioOutlineExample,
  ScenarioOutlineNode,
} from "../../types";

interface World {
  readonly value?: number;
}

type Mutable<T> = { -readonly [P in keyof T]: T[P] };

const createScope = (
  kind: ScopeNode<World>["kind"],
  id: string,
  name: string,
  extras: Partial<ScopeNode<World>> = {}
): ScopeNode<World> => ({
  id,
  kind,
  name,
  mode: extras.mode ?? "default",
  tags: extras.tags ?? [],
  timeout: extras.timeout,
  description: extras.description,
  source: extras.source,
  data: extras.data ? { ...extras.data } : undefined,
  examples: extras.examples,
  steps: extras.steps ? [...extras.steps] : [],
  hooks: extras.hooks ? [...extras.hooks] : [],
  children: extras.children ? [...extras.children] : [],
});

const simpleScenario = (id: string, name: string): SimpleScenario => ({
  id,
  keyword: "Scenario",
  name,
  description: "",
  tags: [],
  steps: [],
  location: { line: 1, column: 1 },
});

const simpleOutline = (id: string, name: string): SimpleScenarioOutline => ({
  id,
  keyword: "Scenario Outline",
  name,
  description: "",
  tags: [],
  steps: [],
  exampleGroups: [],
  compiledScenarios: [],
  location: { line: 1, column: 1 },
});

const featureDescriptor: SimpleFeature = {
  id: "feature",
  keyword: "Feature",
  language: "en",
  name: "Feature",
  description: "",
  tags: ["@feature"],
  elements: [],
  comments: [],
  location: { line: 1, column: 1 },
};

describe("internal nodes", () => {
  it("computes scenario execution results and cloning behaviour", () => {
    const featureScope = createScope("feature", "feature-scope", "Feature");
    const scenarioScope = createScope("scenario", "scenario-scope", "Scenario", {
      data: { retries: 2 },
      tags: ["@scenario"],
    });

    const summary: ScenarioSummary<World> = {
      id: scenarioScope.id,
      scenario: scenarioScope,
      feature: featureScope,
      ancestors: [featureScope],
      steps: [],
    };

    const executions: ScenarioExecution<World>[] = [];
    const featureNode = createFeatureNode<World>({
      feature: featureDescriptor,
      scope: featureScope,
      executions,
      scenarios: [],
      outlines: [],
      rules: [],
    });

    const scenarioNode = createScenarioNode<World>({
      id: summary.id,
      feature: featureNode,
      name: "Scenario",
      keyword: "Scenario",
      qualifiedName: "Feature: Feature > Scenario: Scenario [scenario-scope]",
      tags: ["@feature", "@scenario"],
      mode: "default",
      scope: scenarioScope,
      summary,
      gherkin: simpleScenario("scenario-id", "Scenario"),
      gherkinSteps: [],
      steps: [],
      ancestors: summary.ancestors,
      data: { retries: 2 },
    });

    executions.push(scenarioNode);
    (featureNode.scenarios as Mutable<typeof featureNode.scenarios>).push(scenarioNode);

    scenarioNode.markSkipped("pending environment");
    expect(scenarioNode.result).toMatchObject({
      status: "skipped",
      reason: "pending environment",
    });

    scenarioNode.reset();
    scenarioNode.markPassed();
    expect(scenarioNode.result.status).toBe("passed");

    scenarioNode.markFailed("boom");
    expect(scenarioNode.result).toMatchObject({
      status: "failed",
      error: expect.any(Error),
    });

    expect(featureNode.listExecutables()).toHaveLength(1);
    expect(featureNode.scenarios[0].data).toEqual({ retries: 2 });
    expect(featureNode.scenarios[0].data).not.toBe(scenarioScope.data);
  });

  it("attaches outlines, examples, and rule ancestry", () => {
    const featureScope = createScope("feature", "feature-scope", "Feature");
    const ruleScope = createScope("rule", "rule-scope", "Rule");
    const outlineScope = createScope("scenarioOutline", "outline-scope", "Outline", {
      data: { retries: 1 },
    });

    const summary: ScenarioSummary<World> = {
      id: outlineScope.id,
      scenario: outlineScope,
      feature: featureScope,
      rule: ruleScope,
      ancestors: [featureScope, ruleScope],
      steps: [] as StepDefinition<World>[],
    };

    const executions: ScenarioExecution<World>[] = [];
    const featureNode = createFeatureNode<World>({
      feature: featureDescriptor,
      scope: featureScope,
      executions,
      scenarios: [],
      outlines: [],
      rules: [],
    });

    const ruleNode = createRuleNode<World>({
      rule: {
        id: "rule",
        keyword: "Rule",
        name: "Rule",
        description: "",
        tags: [],
        elements: [],
        location: { line: 1, column: 1 },
      },
      scope: ruleScope,
      qualifiedName: "Feature: Feature > Rule: Rule [rule-scope]",
      scenarios: [],
      outlines: [],
    });

    (featureNode.rules as Mutable<RuleNode<World>[]>).push(ruleNode);

    const outlineNode = createScenarioOutlineNode<World>({
      outline: simpleOutline("outline", "Outline"),
      summary,
      scope: outlineScope,
      keyword: "Scenario Outline",
      name: "Outline",
      qualifiedName: "Feature: Feature > Rule: Rule [rule-scope] > Scenario Outline: Outline",
      tags: ["@feature"],
      mode: "default",
      ancestors: summary.ancestors,
      rule: ruleNode,
      feature: featureNode,
      data: { retries: 1 },
      examples: [],
    });

    (ruleNode.scenarioOutlines as Mutable<ScenarioOutlineNode<World>[]>).push(outlineNode);

    const exampleGroup: SimpleExampleGroup = {
      id: "examples",
      keyword: "Examples",
      name: "numbers",
      description: "",
      tags: ["@examples"],
      tableHeader: ["value"],
      tableBody: [["1"], ["2"]],
      location: { line: 1, column: 1 },
    };

    const compiled: SimpleCompiledScenario = {
      id: "compiled-1",
      keyword: "Scenario",
      name: "Outline (1)",
      description: "",
      tags: [],
      steps: [],
      exampleIndex: 0,
      exampleGroupId: exampleGroup.id,
      scenarioOutlineId: outlineScope.id,
    };

    const example = createScenarioOutlineExample<World>({
      id: compiled.id,
      feature: featureNode,
      outline: outlineNode,
      name: compiled.name,
      keyword: "Scenario",
      qualifiedName: `${outlineNode.qualifiedName} > Example: ${compiled.name}`,
      tags: ["@feature"],
      mode: "default",
      scope: outlineScope,
      summary,
      gherkin: compiled,
      gherkinSteps: [] as SimpleStep[],
      steps: summary.steps,
      ancestors: summary.ancestors,
      exampleGroup,
      exampleIndex: compiled.exampleIndex,
      data: { custom: true },
    });

    (outlineNode.examples as Mutable<ScenarioOutlineExample<World>[]>).push(example);
    executions.push(example);

    expect(outlineNode.examples).toHaveLength(1);
    expect(outlineNode.examples[0].exampleGroup.name).toBe("numbers");
    expect(outlineNode.examples[0].outline).toBe(outlineNode);
    expect(outlineNode.examples[0].data).toEqual({ custom: true });
    expect(example.compiled).toBe(compiled);
  });
});
