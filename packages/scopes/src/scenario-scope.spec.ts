import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { describe, it, expect, vi } from "vitest";
import { HookCache } from "./caches";
import { FeatureScope } from "./feature-scope";
import { RuleScope } from "./rule-scope";
import { ScenarioOutlineScope } from "./scenario-outline-scope";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";
/*
    Create unit tests for ScenarioScope
    Focus on the following methods:
    - canAttach
    - attach
    - idString
*/
describe("ScenarioScope", () => {
  describe("canAttach", () => {
    it("should return false when the scope is a ScenarioScope", () => {
      // Arrange
      const sut = new ScenarioScope("My Scenario", vi.fn(), new HookCache());
      // Act
      const result = sut.canAttach(
        new ScenarioScope("My Scenario", vi.fn(), new HookCache())
      );
      // Assert
      expect(result).toBe(false);
    });
    it("should return false when the scope is an OutlineScope", () => {
      // Arrange
      const sut = new ScenarioScope("My Scenario", vi.fn(), new HookCache());
      // Act
      const result = sut.canAttach(
        new ScenarioOutlineScope(
          "My Scenario Outline",
          vi.fn(),
          new HookCache()
        )
      );
      // Assert
      expect(result).toBe(false);
    });
    it("should return false when the scope is a RuleScope", () => {
      const sut = new ScenarioScope("My Scenario", vi.fn(), new HookCache());
      const result = sut.canAttach(
        new RuleScope("My Rule", vi.fn(), new HookCache())
      );
      expect(result).toBe(false);
    });
    it("should return false when the scope is a FeatureScope", () => {
      const sut = new ScenarioScope("My Scenario", vi.fn(), new HookCache());
      const result = sut.canAttach(
        new FeatureScope("My Feature", vi.fn(), new HookCache())
      );
      expect(result).toBe(false);
    });
    it("should return true when the scope is a StepScope", () => {
      const sut = new ScenarioScope("My Scenario", vi.fn(), new HookCache());
      const expression = new CucumberExpression(
        "my step",
        new ParameterTypeRegistry()
      );
      const result = sut.canAttach(
        new StepScope("Given", "Context", expression, vi.fn())
      );
      expect(result).toBe(true);
    });
  });
});
