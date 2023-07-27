import { describe, it, expect, vi, beforeEach } from "vitest";
import { TestBuilder } from "./test-builder";
import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import {
  BackgroundBuilder,
  ExampleBuilder,
  ExamplesBuilder,
  RuleBuilder,
  ScenarioBuilder,
  ScenarioOutlineBuilder
} from "@autometa/gherkin";
import { FeatureBuilder } from "@autometa/gherkin";
import {
  Empty_Function,
  GlobalScope,
  ScenarioOutlineScope,
  ScenarioScope
} from "@autometa/scopes";
import { FeatureScope } from "@autometa/scopes";
import { HookCache } from "@autometa/scopes";
import { StepCache } from "@autometa/scopes";
import { ScenarioOutlineBridge } from "./bridges";
import { StepBuilder } from "@autometa/gherkin";
import { BackgroundScope } from "@autometa/scopes";
import { StepScope } from "@autometa/scopes";
 const parameterRegistry = new ParameterTypeRegistry();
const globalScope = vi.mocked(GlobalScope);
const global = new globalScope(parameterRegistry);
const onFeatureExecuted = vi.fn();
global.onFeatureExecuted = onFeatureExecuted;
const hooks = new HookCache();
const steps = new StepCache();
beforeEach(() => {
  vi.resetAllMocks();
});

describe("TestBuilder", () => {
  it("should walk through an empty Feature", () => {
    const feature = new FeatureBuilder().name("My Feature").build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
  });
  it("should walk through a Feature with a Rule", () => {
    const rule = new RuleBuilder().name("My Rule").build();
    const feature = new FeatureBuilder()
      .name("My Feature")
      .append("children", rule)
      .build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.rules.length).toBe(1);
    expect(bridge.rules[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.rules[0].data.scope).toBe(scope.closedScopes[0]);
  });
  it("should walk through a Feature with a Scenario", () => {
    const scenario = new ScenarioBuilder().name("My Scenario").build();
    const feature = new FeatureBuilder()
      .name("My Feature")
      .append("children", scenario)
      .build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.scenarios.length).toBe(1);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
  });
  it("should walk through a Feature with a Rule containing a Scenario", () => {
    const scenario = new ScenarioBuilder().name("My Scenario").build();
    const rule = new RuleBuilder()
      .name("My Rule")
      .append("children", scenario)
      .build();
    const feature = new FeatureBuilder()
      .name("My Feature")
      .append("children", rule)
      .build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.rules.length).toBe(1);
    expect(bridge.rules[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.rules[0].data.scope).toBe(scope.closedScopes[0]);
    expect(bridge.rules[0].scenarios.length).toBe(1);
    expect(bridge.rules[0].scenarios[0].data.gherkin).toBe(
      feature.children[0].children[0]
    );
    expect(bridge.rules[0].scenarios[0].data.scope).toBe(
      scope.closedScopes[0].closedScopes[0]
    );
  });
  it("should walk through a Feature containing a Scenario Outline", () => {
    const scenario = new ScenarioOutlineBuilder()
      .name("My Scenario Outline")
      .build();
    const feature = new FeatureBuilder()
      .name("My Feature")
      .append("children", scenario)
      .build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.scenarios.length).toBe(1);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
  });
  it("should walk through a feature with a Scenario Outline containing Examples", () => {
    const outline = new ScenarioOutlineBuilder()
      .name("My Scenario Outline")
      .build();
    const example = new ExampleBuilder().name("My Example").build();
    const examples = new ExamplesBuilder()
      .name("My Examples")
      .append("children", example)
      .build();
    outline.children.push(examples);
    const feature = new FeatureBuilder()
      .name("My Feature")
      .append("children", outline)
      .build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.scenarios.length).toBe(1);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
    const outlineBridge = bridge.scenarios[0] as ScenarioOutlineBridge;
    expect(outlineBridge).toBeInstanceOf(ScenarioOutlineBridge);
    expect(outlineBridge.examples.length).toBe(1);
    expect(outlineBridge.examples[0].data.gherkin).toBe(examples);
  });
  it("should walk through a feature with steps", () => {
    const step = new StepBuilder()
      .keyword("Given")
      .keywordType("Context")
      .text("test step foo")
      .build();
    const feature = new FeatureBuilder().append("children", step).build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("test step foo", parameterRegistry),
      vi.fn()
    );
    scope.attach(stepScope);
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.steps.length).toBe(1);
    expect(bridge.steps[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.steps[0].data.scope).toBe(scope.closedScopes[0]);
  });
  it("should walk through a feature with a scenario with steps", () => {
    const step = new StepBuilder()
      .keyword("Given")
      .keywordType("Context")
      .text("test step foo")
      .build();
    const scenario = new ScenarioBuilder()
      .name("My Scenario")
      .append("children", step)
      .build();
    const feature = new FeatureBuilder().append("children", scenario).build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const scenarioScope = new ScenarioScope(
      "My Scenario",
      vi.fn(),
      scope.hooks,
      scope.steps,
      scope.buildStepCache
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("test step foo", parameterRegistry),
      vi.fn()
    );
    scenarioScope.attach(stepScope);
    scope.attach(scenarioScope);
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.scenarios.length).toBe(1);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
    expect(bridge.scenarios[0].steps.length).toBe(1);
    expect(bridge.scenarios[0].steps[0].data.gherkin).toBe(
      feature.children[0].children[0]
    );
    expect(bridge.scenarios[0].steps[0].data.scope).toBe(
      scope.closedScopes[0].closedScopes[0]
    );
  });
  it("should walk through a feature with a scenario outline with steps", () => {
    const step = new StepBuilder()
      .keyword("Given")
      .keywordType("Context")
      .text("test step foo")
      .build();
    const outline = new ScenarioOutlineBuilder()
      .name("My Scenario Outline")
      .append("children", step)
      .build();
    const feature = new FeatureBuilder().append("children", outline).build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const outlineScope = new ScenarioOutlineScope(
      "My Scenario Outline",
      vi.fn(),
      scope.hooks,
      scope.steps,
      scope.buildStepCache
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("test step foo", parameterRegistry),
      vi.fn()
    );
    outlineScope.attach(stepScope);
    scope.attach(outlineScope);
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.scenarios.length).toBe(1);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    expect(bridge.scenarios[0].data.scope).toBe(scope.closedScopes[0]);
    expect(bridge.scenarios[0].steps.length).toBe(1);
    expect(bridge.scenarios[0].steps[0].data.gherkin).toBe(
      feature.children[0].children[0]
    );
    expect(bridge.scenarios[0].steps[0].data.scope).toBe(
      scope.closedScopes[0].closedScopes[0]
    );
  });
  it("should walk through a feature with a scenario outline with examples with steps", () => {
    const step = new StepBuilder()
      .keyword("Given")
      .keywordType("Context")
      .text("test step foo")
      .build();
    const examples = new ExamplesBuilder()
      .name("My Examples")
      .append("children", step)
      .build();
    const outline = new ScenarioOutlineBuilder()
      .name("My Scenario Outline")
      .append("children", examples)
      .build();
    const feature = new FeatureBuilder().append("children", outline).build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const outlineScope = new ScenarioOutlineScope(
      "My Scenario Outline",
      vi.fn(),
      scope.hooks,
      scope.steps,
      scope.buildStepCache
    );
    const examplesScope = new ScenarioScope(
      "My Examples",
      vi.fn(),
      outlineScope.hooks,
      outlineScope.steps,
      outlineScope.buildStepCache
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("test step foo", parameterRegistry),
      vi.fn()
    );
    examplesScope.attach(stepScope);
    outlineScope.attach(examplesScope);
    scope.attach(outlineScope);
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    expect(bridge.data.gherkin).toBe(feature);
    expect(bridge.data.scope).toBe(scope);
    expect(bridge.scenarios.length).toBe(1);
    expect(bridge.scenarios[0].data.gherkin).toBe(feature.children[0]);
    const outlineBridge = bridge.scenarios[0] as ScenarioOutlineBridge;
    expect(outlineBridge.examples[0].steps.length).toBe(1);
    expect(outlineBridge.examples[0].steps[0].data.scope).toBe(stepScope);
  });
  it("should walk through a feature with a background with steps", () => {
    const step = new StepBuilder()
      .keyword("Given")
      .keywordType("Context")
      .text("test step foo")
      .build();
    const bg = new BackgroundBuilder()
      .name("my background")
      .append("children", step)
      .build();
    const feature = new FeatureBuilder().append("children", bg).build();
    const scope = new FeatureScope(
      "My Feature",
      vi.fn(),
      hooks,
      steps,
      Empty_Function
    );
    const bgScope = new BackgroundScope(
      "bob",
      Empty_Function,
      scope.hooks,
      scope.steps,
      scope.buildStepCache
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("test step foo", parameterRegistry),
      vi.fn()
    );
    bgScope.attach(stepScope);
    scope.attach(bgScope);
    const builder = new TestBuilder(global, feature);
    const bridge = builder.onFeatureExecuted(scope);
    const background = bridge.background;
    expect(background.data.gherkin.name).toEqual("my background");
    expect(background.steps).toHaveLength(1);
    expect(background.steps[0].data.gherkin).toEqual(step);
    expect(background.steps[0].data.scope).toEqual(
      scope.closedScopes[0].closedScopes[0]
    );
  });
});
