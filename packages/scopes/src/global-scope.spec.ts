import {
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { describe, expect, it, vi } from "vitest";
import { GlobalScope } from "./global-scope";
import { Scope } from "./scope";
describe("Global Scope", () => {
  describe("attach", () => {
    it("should fail to attach an unknown scope", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = action;
      expect(() => sut.attach(Object.create(Scope))).toThrow(
        "Only FeatureScope and StepScope can be executed globally. Scenarios, Outlines and Rules must exist inside a Feature"
      );
    });
  });
  describe("Feature", () => {
    it("should attach a feature scope with a filepath and action", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = action;
      const feature = sut.Feature(action, "filepath");
      const featAction = feature.action as typeof action;
      featAction();
      expect(feature).toBeDefined();
      expect(feature.action).toBeDefined();
      expect(feature.action).toHaveBeenCalled();
      expect(feature.path).toBe("filepath");
    });
    it("should attach a feature scope with a filepath and action", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = action;
      const feature = sut.Feature("filepath");
      expect(feature).toBeDefined();
      expect(feature.action?.name).toEqual("Empty_Function");
      expect(feature.path).toBe("filepath");
    });
  });
});
