import { HTable } from "@autometa/gherkin";
import {
  FeatureScope,
  HookCache,
  StepCache,
  RuleScope,
  ScenarioScope,
  ScenarioOutlineScope,
  StepScope
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
    const foundScenario = scope(featureScope).findScenario(
      "test scenario",
      "test rule"
    );
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
      "test scenario outline",
      "test rule"
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
    );
    featureScope.closedScopes.push(stepScope);
    const foundStep = scope(featureScope).findStep("Context", "my step");
    expect(foundStep).toBeDefined();
    expect(foundStep).toBeInstanceOf(StepScope);
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
    );
    ruleScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(ruleScope);
    const foundStep = scope(featureScope).findStep("Context", "my step", {
      rule: "test rule"
    });
    expect(foundStep).toBeDefined();
    expect(foundStep).toBeInstanceOf(StepScope);
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
    );
    scenarioScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(scenarioScope);
    const foundStep = scope(featureScope).findStep("Context", "my step", {
      scenario: "test scenario"
    });
    expect(foundStep).toBeDefined();
    expect(foundStep).toBeInstanceOf(StepScope);
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
    );
    outlineScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(outlineScope);
    const foundStep = scope(featureScope).findStep("Context", "my step", {
      outline: "test outline"
    });
    expect(foundStep).toBeDefined();
    expect(foundStep).toBeInstanceOf(StepScope);
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
    );
    outlineScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(outlineScope);
    const foundStep = scope(featureScope).findStep("Context", "my step", {
      outline: "test outline"
    });
    expect(foundStep).toBeDefined();
    expect(foundStep).toBeInstanceOf(StepScope);
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
    );
    ruleScope.closedScopes.push(outlineScope);
    outlineScope.closedScopes.push(stepScope);
    featureScope.closedScopes.push(ruleScope);
    const foundStep = scope(featureScope).findStep("Context", "my step", {
      rule: "test rule",
      outline: "test outline"
    });
    expect(foundStep).toBeDefined();
    expect(foundStep).toBeInstanceOf(StepScope);
  });
});
