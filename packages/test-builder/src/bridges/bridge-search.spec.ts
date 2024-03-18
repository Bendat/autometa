import {
  ExamplesBuilder,
  FeatureBuilder,
  RuleBuilder,
  ScenarioBuilder,
  ScenarioOutlineBuilder,
} from "@autometa/gherkin";
import {
  ExamplesBridge,
  FeatureBridge,
  RuleBridge,
  ScenarioBridge,
  ScenarioOutlineBridge,
} from "./bridge";
import {
  find,
  findExamplesOrChild,
  findRuleTypes,
  findScenario,
  findScenarioOutlineOrChild,
} from "./bridge-search";
import {
  FeatureScope,
  HookCache,
  RuleScope,
  ScenarioOutlineScope,
  ScenarioScope,
  StepCache,
} from "@autometa/scopes";
import { describe, it, vi, expect } from "vitest";

describe("Bridge Search", () => {
  describe("findScenario", () => {
    it("should find a scenario by name", () => {
      const scenario = makeScenario("My Scenario");
      const found = findScenario(scenario, "Scenario: My Scenario");
      expect(found).toBe(scenario);
    });
    it("should find a scenario by from path", () => {
      const scenario = makeScenario("My Scenario");
      const found = findScenario(
        scenario,
        "Feature: my feature Scenario: My Scenario",
        "Feature: my feature"
      );
      expect(found).toBe(scenario);
    });
  });
  describe("Scenario Outline", () => {
    describe("findExamplesOrChild", () => {
      it("should find an Examples by name", () => {
        const examples = makeExamples("My Examples");
        const found = findExamplesOrChild(examples, "Examples: My Examples");
        expect(found).toBe(examples);
      });
      it("should find an Examples by from path", () => {
        const examples = makeExamples("My Examples");
        const found = findExamplesOrChild(examples, "Examples: My Examples");
        expect(found).toBe(examples);
      });
      it("should find a Scenario by name in an Examples", () => {
        const examples = makeExamples("My Examples");
        const scenario = makeScenario("My Scenario");
        examples.scenarios.push(scenario);
        const found = findExamplesOrChild(examples, "Scenario: My Scenario");
        expect(found).toBe(scenario);
      });
      it("should find a Scenario by name in an Examples by from path", () => {
        const examples = makeExamples("My Examples");
        const scenario = makeScenario("My Scenario");
        examples.scenarios.push(scenario);
        const found = findExamplesOrChild(
          examples,
          "Examples: My Examples Scenario: My Scenario"
        );
        expect(found).toBe(scenario);
      });
    });
    describe("findScenarioOutlineOrChild", () => {
      it("should find a Scenario Outline by name", () => {
        const outline = makeScenarioOutline("My Scenario Outline");
        const found = findScenarioOutlineOrChild(
          outline,
          "Scenario Outline: My Scenario Outline"
        );
        expect(found).toBe(outline);
      });
      it("should find a Scenario by name in a Scenario Outline", () => {
        const outline = makeScenarioOutline("My Scenario Outline");
        const scenario = makeScenario("My Scenario");
        const examples = makeExamples("My Examples");
        examples.scenarios.push(scenario);
        outline.examples.push(examples);
        const found = findScenarioOutlineOrChild(
          outline,
          "Scenario: My Scenario"
        );
        expect(found).toBe(scenario);
      });
      it("should find a Scenario by name in a Scenario Outline by from path", () => {
        const outline = makeScenarioOutline("My Scenario Outline");
        const scenario = makeScenario("My Scenario");
        const examples = makeExamples("My Examples");
        examples.scenarios.push(scenario);
        outline.examples.push(examples);
        const found = findScenarioOutlineOrChild(
          outline,
          "Scenario Outline: My Scenario Outline Examples: My Examples Scenario: My Scenario"
        );
        expect(found).toBe(scenario);
      });
      it("should find an Examples by name in a Scenario Outline", () => {
        const outline = makeScenarioOutline("My Scenario Outline");
        const examples = makeExamples("My Examples");
        outline.examples.push(examples);
        const found = findScenarioOutlineOrChild(
          outline,
          "Examples: My Examples"
        );
        expect(found).toBe(examples);
      });
      it("should find an Examples by name in a Scenario Outline by from path", () => {
        const outline = makeScenarioOutline("My Scenario Outline");
        const examples = makeExamples("My Examples");
        outline.examples.push(examples);
        const found = findScenarioOutlineOrChild(
          outline,
          "Scenario Outline: My Scenario Outline Examples: My Examples"
        );
        expect(found).toBe(examples);
      });
      it("should find a Scenario by name in an Examples in a Scenario Outline", () => {
        const outline = makeScenarioOutline("My Scenario Outline");
        const examples = makeExamples("My Examples");
        const scenario = makeScenario("My Scenario");
        examples.scenarios.push(scenario);
        outline.examples.push(examples);
        const found = findScenarioOutlineOrChild(
          outline,
          "Scenario: My Scenario"
        );
        expect(found).toBe(scenario);
      });
    });
  });
  describe("findRuleType", () => {
    it("should find a rule by name", () => {
      const feature = makeFeature("Feature");
      const rule = makeRule("My Rule");
      feature.rules.push(rule);
      console.log(rule.data.scope.name);
      const found = findRuleTypes(feature.rules, "Rule: My Rule");
      expect(found).toBe(rule);
    });
    it("should find a scenario by name inside a rule", () => {
      const feature = makeFeature("Feature");
      const rule = makeRule("My Rule");
      const scenario = makeScenario("My Scenario");
      rule.scenarios.push(scenario);
      feature.rules.push(rule);
      const found = findRuleTypes(feature.rules, "Scenario: My Scenario");
      expect(found).toBe(scenario);
    });
    it("should find a scenario by name inside a rule by name", () => {
      const feature = makeFeature("Feature");
      const rule = makeRule("My Rule");
      const scenario = makeScenario("My Scenario");
      rule.scenarios.push(scenario);
      feature.rules.push(rule);
      const found = findRuleTypes(
        feature.rules,
        "Rule: My Rule Scenario: My Scenario"
      );
      expect(found).toBe(scenario);
    });
    it("should find a scenario outline by name inside a rule by name", () => {
      const feature = makeFeature("Feature");
      const rule = makeRule("My Rule");
      const scenario = makeScenarioOutline("My Scenario Outline");
      rule.scenarios.push(scenario);
      feature.rules.push(rule);
      const found = findRuleTypes(
        feature.rules,
        "Rule: My Rule Scenario Outline: My Scenario Outline"
      );
      expect(found).toBe(scenario);
    });
    it("should find a scenario outline by name inside a rule", () => {
      const feature = makeFeature("Feature");
      const rule = makeRule("My Rule");
      const scenario = makeScenarioOutline("My Scenario Outline");
      rule.scenarios.push(scenario);
      feature.rules.push(rule);
      const found = findRuleTypes(
        feature.rules,
        "Scenario Outline: My Scenario Outline"
      );
      expect(found).toBe(scenario);
    });
  });
  describe("find", () => {
    it("should find a scenario by a jest format test name", () => {
      const feature = makeFeature("My Feature");
      const rule = makeRule("My Rule");
      const scenario = makeScenario("My Scenario");
      rule.scenarios.push(scenario);
      feature.rules.push(rule);
      const found = find(
        feature,
        "Feature: My Feature Rule: My Rule Scenario: My Scenario"
      );
      expect(found).toBe(scenario);
    });
  });
});
function makeFeature(name: string) {
  const bridge = new FeatureBridge();
  bridge.data = {
    gherkin: new FeatureBuilder().name(name).keyword("Feature").build(),
    scope: new FeatureScope(
      "",
      vi.fn(),
      new HookCache(),
      new StepCache(),
      vi.fn()
    ),
  };
  return bridge;
}

function makeScenario(name: string) {
  const bridge = new ScenarioBridge();
  bridge.data = {
    gherkin: new ScenarioBuilder().name(name).keyword("Scenario").build(),
    scope: new ScenarioScope(
      name,
      vi.fn(),
      new HookCache(),
      new StepCache(),
      vi.fn()
    ),
  };
  return bridge;
}

function makeScenarioOutline(name: string) {
  const bridge = new ScenarioOutlineBridge();
  bridge.data = {
    gherkin: new ScenarioOutlineBuilder()
      .name(name)
      .keyword("Scenario Outline")
      .build(),
    scope: new ScenarioOutlineScope(
      name,
      vi.fn(),
      new HookCache(),
      new StepCache(),
      vi.fn()
    ),
  };
  return bridge;
}

function makeExamples(name: string) {
  const bridge = new ExamplesBridge();
  bridge.data = {
    gherkin: new ExamplesBuilder().name(name).keyword("Examples").build(),
    scope: new ScenarioOutlineScope(
      name,
      vi.fn(),
      new HookCache(),
      new StepCache(),
      vi.fn()
    ),
  };
  return bridge;
}

function makeRule(name: string) {
  const bridge = new RuleBridge();
  bridge.data = {
    gherkin: new RuleBuilder().name(name).keyword("Rule").build(),
    scope: new RuleScope(
      name,
      vi.fn(),
      new HookCache(),
      new StepCache(),
      vi.fn()
    ),
  };
  return bridge;
}
