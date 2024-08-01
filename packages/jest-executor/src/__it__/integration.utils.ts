import {
  BackgroundBridge,
  ExamplesBridge,
  FeatureBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
  StepBridge,
} from "@autometa/test-builder";
import {
  FeatureScope,
  HookCache,
  RuleScope,
  ScenarioOutlineScope,
  ScenarioScope,
  StepCache,
  BackgroundScope,
  StepScope,
} from "@autometa/scopes";
import {
  BackgroundBuilder,
  ExamplesBuilder,
  FeatureBuilder,
  RuleBuilder,
  ScenarioBuilder,
  ScenarioOutlineBuilder,
  StepBuilder,
  StepKeyword,
  StepType,
  DataTable,
} from "@autometa/gherkin";
import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { vi } from "vitest";

export const TestRegistry = new ParameterTypeRegistry();
export function makeFeature(name: string) {
  const bridge = new FeatureBridge();
  bridge.data = {
    gherkin: new FeatureBuilder().name(name).keyword("Feature").build(),
    scope: new FeatureScope(
      "",
      vi.fn(),
      undefined,
      new HookCache(),
      new StepCache()
    ),
  };
  return bridge;
}

export function makeBackground(name: string) {
  const bridge = new BackgroundBridge();
  bridge.data = {
    gherkin: new BackgroundBuilder().name(name).keyword("Background").build(),
    scope: new BackgroundScope(name, vi.fn(), new HookCache(), new StepCache()),
  };
  return bridge;
}
export function makeScenario(name: string) {
  const bridge = new ScenarioBridge();
  bridge.data = {
    gherkin: new ScenarioBuilder().name(name).keyword("Scenario").build(),
    scope: new ScenarioScope(
      name,
      vi.fn(),
      undefined,
      new HookCache(),
      new StepCache()
    ),
  };
  return bridge;
}

export function makeScenarioOutline(name: string) {
  const bridge = new ScenarioOutlineBridge();
  bridge.data = {
    gherkin: new ScenarioOutlineBuilder()
      .name(name)
      .keyword("Scenario Outline")
      .build(),
    scope: new ScenarioOutlineScope(
      name,
      vi.fn(),
      undefined,
      new HookCache(),
      new StepCache()
    ),
  };
  return bridge;
}

export function makeExamples(name: string) {
  const bridge = new ExamplesBridge();
  bridge.data = {
    gherkin: new ExamplesBuilder().name(name).keyword("Examples").build(),
    scope: new ScenarioOutlineScope(
      name,
      vi.fn(),
      undefined,
      new HookCache(),
      new StepCache()
    ),
  };
  return bridge;
}

export function makeRule(name: string) {
  const bridge = new RuleBridge();
  bridge.data = {
    gherkin: new RuleBuilder().name(name).keyword("Rule").build(),
    scope: new RuleScope(
      name,
      vi.fn(),
      undefined,
      new HookCache(),
      new StepCache()
    ),
  };
  return bridge;
}

export function makeStep(keyword: StepKeyword, type: StepType, text: string) {
  const bridge = new StepBridge();
  bridge.data = {
    gherkin: new StepBuilder().text(text).keyword(keyword).build(),
    scope: new StepScope<string, DataTable>(
      keyword,
      type,
      new CucumberExpression(text, TestRegistry),
      vi.fn()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ) as any,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    args: [] as any,
  };
  return bridge;
}
