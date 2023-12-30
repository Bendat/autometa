import { describe, it, expect } from "vitest";
import {
  ExampleBuilder,
  ExamplesBuilder,
  FeatureBuilder,
  RuleBuilder,
  ScenarioBuilder,
  StepBuilder
} from "@autometa/gherkin";
import { Query } from "./bridge-query";
describe("Query", () => {
  describe("testNames", () => {
    it("should return an array of test names", () => {
      const step = new StepBuilder().keyword("Given").text("a step").build();
      const scenario1 = new ScenarioBuilder()
        .keyword("Scenario")
        .name("scenario 1")
        .append("children", step)
        .build();
      const scenario2 = new ScenarioBuilder()
        .keyword("Scenario")
        .name("scenario 2")
        .append("children", step)
        .build();
      const scenario3 = new ScenarioBuilder()
        .keyword("Scenario")
        .name("scenario 3")
        .append("children", step)
        .build();
      const rule = new RuleBuilder()
        .keyword("Rule")
        .name("rule 1")
        .append("children", scenario1)
        .build();
      const example = new ExampleBuilder()
        .keyword("Example")
        .name("example 1")
        .append("children", scenario2)
        .build();
      const examples = new ExamplesBuilder()
        .keyword("Examples")
        .name("examples 1")
        .append("children", example)
        .build();
      const scenarioOutline = new ScenarioBuilder()
        .keyword("Scenario Outline")
        .name("scenario outline 1")
        .append("children", examples)
        .build();
      const feature = new FeatureBuilder()
        .keyword("Feature")
        .name("feature 1")
        .append("children", scenario3)
        .append("children", rule)
        .append("children", scenarioOutline)
        .build();
      const testNames = Query.testNames(feature);
      expect(testNames).toEqual([
        "Feature: feature 1",
        "Feature: feature 1 Scenario: scenario 3",
        "Feature: feature 1 Rule: rule 1",
        "Feature: feature 1 Rule: rule 1 Scenario: scenario 1",
        "Feature: feature 1 Scenario Outline: scenario outline 1",
        "Feature: feature 1 Scenario Outline: scenario outline 1 Examples: examples 1",
        "Feature: feature 1 Scenario Outline: scenario outline 1 Examples: examples 1 Example: example 1",
        "Feature: feature 1 Scenario Outline: scenario outline 1 Examples: examples 1 Example: example 1 Scenario: scenario 2"
      ]);
    });
  });
});
