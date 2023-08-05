import { HTable } from "@autometa/gherkin";
import {
  FeatureScope,
  HookCache,
  StepCache,
  RuleScope,
  ScenarioScope,
  ScenarioOutlineScope,
  StepScope,
  Empty_Function
} from "@autometa/scopes";
import {
  CucumberExpression,
  ParameterTypeRegistry
} from "@cucumber/cucumber-expressions";
import { scope } from "./scope-search";
import { describe, it, expect } from "vitest";
describe("ScopeSearch", () => {
  it("should find a rule by name", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    featureScope.closedScopes.push(
      new RuleScope(
        "test rule",
        () => undefined,
        new HookCache(),
        new StepCache(),
        Empty_Function
      )
    );
    const rule = scope(featureScope).findRule("test rule");
    expect(rule).toBeDefined();
    expect(rule).toBeInstanceOf(RuleScope);
  });

  it("should find a scenario by name", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    featureScope.closedScopes.push(
      new ScenarioScope(
        "test scenario",
        () => undefined,
        new HookCache(),
        new StepCache(),
        Empty_Function
      )
    );
    const foundScenario = scope(featureScope).findScenario("test scenario");
    expect(foundScenario).toBeDefined();
    expect(foundScenario).toBeInstanceOf(ScenarioScope);
  });

  it("should find a scenario by name in a rule", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const scenarioScope = new ScenarioScope(
      "test scenario",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    ruleScope.closedScopes.push(scenarioScope);
    featureScope.closedScopes.push(ruleScope);
    const foundScenario = scope(featureScope).findScenario("test scenario");
    expect(foundScenario).toBeDefined();
    expect(foundScenario).toBeInstanceOf(ScenarioScope);
  });
  it("should find a scenario outline by name", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const outlineScope = new ScenarioOutlineScope(
      "test scenario outline",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    ruleScope.closedScopes.push(outlineScope);
    featureScope.closedScopes.push(ruleScope);
    const foundScenario = scope(featureScope).findScenarioOutline(
      "test scenario outline"
    );
    expect(foundScenario).toBeDefined();
    expect(foundScenario).toBeInstanceOf(ScenarioScope);
  });
  it("should find a scenario outline by name in a rule", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    featureScope.closedScopes.push(
      new ScenarioOutlineScope(
        "test scenario outline",
        () => undefined,
        new HookCache(),
        new StepCache(),
        Empty_Function
      )
    );
    const foundScenario = scope(featureScope).findScenarioOutline(
      "test scenario outline"
    );
    expect(foundScenario).toBeDefined();
    expect(foundScenario).toBeInstanceOf(ScenarioScope);
  });
  it("should find a step in the feature", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    );
    featureScope.closedScopes.push(stepScope);
    featureScope.buildStepCache();
    const foundStep = scope(featureScope).findStep(
      "Context",
      "Given",
      "my step"
    );
    expect(foundStep).toBeDefined();
    expect(foundStep.step).toBeInstanceOf(StepScope);
  });
  it("should find a step in a rule", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    );
    ruleScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(ruleScope);
    const foundStep = scope(ruleScope).findStep("Context", "Given", "my step");
    expect(foundStep).toBeDefined();
    expect(foundStep.step).toBeInstanceOf(StepScope);
  });
  it("should find a step in a scenario", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const scenarioScope = new ScenarioScope(
      "test scenario",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    );
    scenarioScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(scenarioScope);
    const foundStep = scope(scenarioScope).findStep(
      "Context",
      "Given",
      "my step"
    );
    expect(foundStep).toBeDefined();
    expect(foundStep.step).toBeInstanceOf(StepScope);
  });
  it("should find a step in a scenario in a rule", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const outlineScope = new ScenarioOutlineScope(
      "test outline",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    );
    outlineScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(outlineScope);
    const foundStep = scope(outlineScope).findStep(
      "Context",
      "Given",
      "my step"
    );
    expect(foundStep).toBeDefined();
    expect(foundStep.step).toBeInstanceOf(StepScope);
  });
  it("should find a step in a scenario outline", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const outlineScope = new ScenarioOutlineScope(
      "test outline",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    );
    outlineScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(outlineScope);
    const foundStep = scope(outlineScope).findStep(
      "Context",
      "Given",
      "my step"
    );
    expect(foundStep).toBeDefined();
    expect(foundStep.step).toBeInstanceOf(StepScope);
  });
  it("should find a step in a scenario outline in a rule", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const outlineScope = new ScenarioOutlineScope(
      "test outline",
      () => undefined,
      new HookCache(),
      new StepCache(),
      Empty_Function
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    );
    ruleScope.closedScopes.push(outlineScope);
    outlineScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(ruleScope);
    const foundStep = scope(outlineScope).findStep(
      "Context",
      "Given",
      "my step"
    );
    expect(foundStep).toBeDefined();
    expect(foundStep.step).toBeInstanceOf(StepScope);
  });
});
