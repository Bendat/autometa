import { HTable } from "@autometa/gherkin";
import {
  FeatureScope,
  HookCache,
  StepCache,
  RuleScope,
  ScenarioScope,
  ScenarioOutlineScope,
  StepScope,
  CachedStep,
} from "@autometa/scopes";
import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { scope } from "./scope-search";
import { describe, it, expect } from "vitest";
describe("ScopeSearch", () => {
  it("should find a rule by name", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    featureScope.closedScopes.push(
      new RuleScope(
        "test rule",
        () => undefined,
        new HookCache(),
        new StepCache()
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
      new StepCache()
    );
    featureScope.closedScopes.push(
      new ScenarioScope(
        "test scenario",
        () => undefined,
        new HookCache(),
        new StepCache()
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
      new StepCache()
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const scenarioScope = new ScenarioScope(
      "test scenario",
      () => undefined,
      new HookCache(),
      new StepCache()
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
      new StepCache()
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const outlineScope = new ScenarioOutlineScope(
      "test scenario outline",
      () => undefined,
      new HookCache(),
      new StepCache()
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
      new StepCache()
    );
    featureScope.closedScopes.push(
      new ScenarioOutlineScope(
        "test scenario outline",
        () => undefined,
        new HookCache(),
        new StepCache()
      )
    );
    const foundScenario = scope(featureScope).findScenarioOutline(
      "test scenario outline"
    );
    expect(foundScenario).toBeDefined();
    expect(foundScenario).toBeInstanceOf(ScenarioScope);
  });
  it("should find an example by name in a scenario outline", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const outlineScope = new ScenarioOutlineScope(
      "test scenario outline",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const exampleScope = new ScenarioScope(
      "test example",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    outlineScope.closedScopes.push(exampleScope);
    featureScope.closedScopes.push(outlineScope);
    const foundScenario = scope(featureScope).findExample("test example");
    expect(foundScenario).toBeDefined();
    expect(foundScenario).toBeInstanceOf(ScenarioScope);
  });
  it("should find a step in the feature", () => {
    const featureScope = new FeatureScope(
      "",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    ) as CachedStep;
    featureScope.closedScopes.push(stepScope);
    featureScope.steps.add(stepScope);

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
      new StepCache()
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    ) as CachedStep;
    ruleScope.closedScopes.push(stepScope);
    ruleScope.steps.add(stepScope);
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
      new StepCache()
    );
    const scenarioScope = new ScenarioScope(
      "test scenario",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    ) as CachedStep;
    scenarioScope.closedScopes.push(stepScope);
    scenarioScope.steps.add(stepScope);
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
      new StepCache()
    );
    const outlineScope = new ScenarioOutlineScope(
      "test outline",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    ) as CachedStep;
    outlineScope.closedScopes.push(stepScope);
    outlineScope.steps.add(stepScope);
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
      new StepCache()
    );
    const outlineScope = new ScenarioOutlineScope(
      "test outline",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    ) as CachedStep;
    outlineScope.closedScopes.push(stepScope);
    outlineScope.steps.add(stepScope);
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
      new StepCache()
    );
    const ruleScope = new RuleScope(
      "test rule",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const outlineScope = new ScenarioOutlineScope(
      "test outline",
      () => undefined,
      new HookCache(),
      new StepCache()
    );
    const stepScope = new StepScope(
      "Given",
      "Context",
      new CucumberExpression("my step", new ParameterTypeRegistry()),
      () => undefined,
      HTable
    ) as CachedStep;
    ruleScope.closedScopes.push(outlineScope);
    outlineScope.closedScopes.push(stepScope);
    outlineScope.steps.add(stepScope);
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
