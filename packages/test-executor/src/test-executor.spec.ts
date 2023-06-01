import {
  Examples,
  ExamplesBuilder,
  Feature,
  FeatureBuilder,
  Rule,
  RuleBuilder,
  Scenario,
  ScenarioBuilder,
  ScenarioOutline,
  ScenarioOutlineBuilder,
  StepBuilder,
} from "@autometa/gherkin";
import { DtoBuilder } from "@autometa/dto-builder";
import { FeatureScope, HookCache, RuleScope, StepCache } from "@autometa/scopes";

import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TestExecutor } from "./test-executor";
import { Test, TestGroupContainer } from "./container";
import { App, AutometaApp, AutometaWorld, World } from "@autometa/app";
import { TestExecutorConfig } from "./config.schema";
import { TestFunction } from "@autometa/types";
import { TestGroup } from "./types";

class TestWorld extends AutometaWorld implements World {}
class TestApp extends AutometaApp implements App {
  world: World;
}

const registry = new ParameterTypeRegistry();
let scenarioBuilder: DtoBuilder<Scenario>;
let examplesBuilder: DtoBuilder<Examples>;
let outlineBuilder: DtoBuilder<ScenarioOutline>;
let featureBuilder: DtoBuilder<Feature>;
let ruleBuilder: DtoBuilder<Rule>;
beforeEach(() => {
  scenarioBuilder = new ScenarioBuilder().name("test scenario");
  examplesBuilder = new ExamplesBuilder().name("test scenario");
  outlineBuilder = new ScenarioOutlineBuilder().name("test outline");
  featureBuilder = new FeatureBuilder().name("test feature");
  ruleBuilder = new RuleBuilder().name("test rule");
});
describe("Test Executor", () => {
  describe("onFeatureExecuted - gherkin", () => {
    it("Should walk through a feature with a single scenario", () => {
      const scenario = scenarioBuilder.build();
      const feature = featureBuilder.children([scenario]).build();
      const scope = new FeatureScope("", () => undefined, new HookCache(), new StepCache());
      const sut = new TestExecutor(registry, feature).withConfig(FakeConfig);
      const test = sut.onFeatureExecuted(scope);
      const [scenarioChild] = test.children;
      expect(test.data).toEqual({ gherkin: feature, scope });
      expect(scenarioChild.name).toEqual(scenario.name);
    });

    it("should walk through a feature tree with a rule", () => {
      const scenario = scenarioBuilder.build();
      const rule = ruleBuilder.children([scenario]).build();
      const feature = featureBuilder.children([rule]).build();
      const scope = new FeatureScope("", () => undefined, new HookCache(), new StepCache());
      const ruleScope = new RuleScope("test rule", () => undefined, scope.hooks, new StepCache());
      scope.attach(ruleScope);
      const sut = new TestExecutor(registry, feature).withConfig(FakeConfig);
      const test = sut.onFeatureExecuted(scope);
      const [ruleChild] = test.children as unknown as TestGroupContainer[];
      const [scenarioChild] = ruleChild.children;
      expect(ruleChild.data).toEqual({ gherkin: rule, scope: ruleScope });
      expect(ruleChild.name).toEqual(rule.name);
      expect(scenarioChild.data.gherkin).toEqual(scenario);
      expect(scenarioChild.name).toEqual(scenario.name);
    });
    it("should walk through a feature tree with 2 rules", () => {
      const scenario = scenarioBuilder.build();
      const rule = ruleBuilder.children([scenario]).build();
      const rule2 = ruleBuilder.name("rule2F").children([scenario]).build();
      const feature = featureBuilder.children([rule, rule2]).build();
      const scope = new FeatureScope("", () => undefined, new HookCache(), new StepCache());
      const sut = new TestExecutor(registry, feature).withConfig(FakeConfig);
      const test = sut.onFeatureExecuted(scope);
      const [ruleChild1, ruleChild2] = test.children as unknown as TestGroupContainer[];
      const [scenarioChild] = ruleChild1.children;
      const [scenarioChild2] = ruleChild2.children;
      expect(ruleChild1.data.gherkin).toEqual(rule);
      expect(ruleChild2.data.gherkin).toEqual(rule2);
      expect(ruleChild1.name).toEqual(rule.name);
      expect(ruleChild2.name).toEqual(rule2.name);
      expect(scenarioChild.data.gherkin).toEqual(scenario);
      expect(scenarioChild2.name).toEqual(scenario.name);
    });
    it("should walk through a tree with steps", () => {
      const givenStep = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("given")
        .build();
      const whenStep = new StepBuilder()
        .keyword("When")
        .keywordType("Action")
        .text("given")
        .build();
      const scenario = scenarioBuilder.children([givenStep, whenStep]).build();
      const feature = featureBuilder.children([scenario]).build();
      const scope = new FeatureScope("", () => undefined, new HookCache(), new StepCache());
      const sut = new TestExecutor(registry, feature).withConfig(FakeConfig);
      const test = sut.onFeatureExecuted(scope);
      const [scenarioChild] = test.children as Test[];
      const [givenStepChild, whenStepChild] = scenarioChild.steps;
      expect(givenStepChild.data).toEqual({ gherkin: givenStep });
      expect(whenStepChild.data).toEqual({ gherkin: whenStep });
    });
    it("should walk through a scenario outline with steps", () => {
      const givenStep = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("given")
        .build();
      const whenStep = new StepBuilder()
        .keyword("When")
        .keywordType("Action")
        .text("given")
        .build();
      const scenario = scenarioBuilder.children([givenStep, whenStep]).build();
      const example = examplesBuilder.children([scenario]).build();
      const outline = outlineBuilder.children([example]).build();
      const feature = featureBuilder.children([outline]).build();
      const scope = new FeatureScope("", () => undefined, new HookCache(), new StepCache());
      const sut = new TestExecutor(registry, feature).withConfig(FakeConfig);
      const test = sut.onFeatureExecuted(scope);
      const [outlineChild] = test.children as TestGroupContainer[];
      const [examplesChild] = outlineChild.children as TestGroupContainer[];
      const [scenarioChild] = examplesChild.children as Test[];
      const [givenStepChild, whenStepChild] = scenarioChild.steps;
      expect(givenStepChild.data).toEqual({ gherkin: givenStep });
      expect(whenStepChild.data).toEqual({ gherkin: whenStep });
    });

    it("should walk through a scenario with steps", () => {
      const givenStep = new StepBuilder()
        .keyword("Given")
        .keywordType("Context")
        .text("given")
        .build();
      const whenStep = new StepBuilder()
        .keyword("When")
        .keywordType("Action")
        .text("given")
        .build();
      const scenario = scenarioBuilder.children([givenStep, whenStep]).build();
      const feature = featureBuilder.children([scenario]).build();
      const scope = new FeatureScope("", () => undefined, new HookCache(), new StepCache());
      const sut = new TestExecutor(registry, feature).withConfig(FakeConfig);
      const test = sut.onFeatureExecuted(scope);
      const [scenarioChild] = test.children as Test[];
      const [givenStepChild, whenStepChild] = scenarioChild.steps;
      expect(givenStepChild.data).toEqual({ gherkin: givenStep });
      expect(whenStepChild.data).toEqual({ gherkin: whenStep });
    });
  });
});

const FakeConfig: TestExecutorConfig = {
  cucumber: {
    app: TestApp,
    world: TestWorld,
  },
  runner: {
    name: "jest",
    describe: vi.fn() as unknown as TestGroup,
    test: vi.fn() as TestFunction,
    beforeAll: vi.fn(),
    beforeEach: vi.fn(),
    afterEach: vi.fn(),
    afterAll: vi.fn(),
    timeoutFn: vi.fn(),
  },
};
