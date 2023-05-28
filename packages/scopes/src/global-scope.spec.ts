import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { describe, expect, it, vi } from "vitest";
import { GlobalScope } from "./global-scope";
import { Scope } from "./scope";
import { StepScope } from "./step-scope";
const registry = new ParameterTypeRegistry();
describe("Global Scope", () => {
  describe("attach", () => {
    it("should fail to attach an unknown scope", () => {
      const action = vi.fn();
      const sut = new GlobalScope(action, new ParameterTypeRegistry());
      expect(() => sut.attach(Object.create(Scope))).toThrow(
        "Only FeatureScope and StepScope can be executed globally. Scenarios, Outlines and Rules must exist inside a Feature"
      );
    });
  });

  describe("getStepCache", () => {
    it("should compile attached steps a cache", () => {
      const sut = new GlobalScope(vi.fn(), registry);
      sut.closedScopes.push(
        new StepScope(
          "Given",
          "Context",
          new CucumberExpression("hi", registry),
          vi.fn()
        )
      );
      const cache = sut.getStepCache();
      expect(cache).toBeDefined();
      expect(cache.size).toBe(1);
    });
  });
  describe("Feature", () => {
    it("should attach a feature scope with a filepath and action", () => {
      const action = vi.fn();
      const sut = new GlobalScope(vi.fn(), registry);
      const feature = sut.Feature(action, "filepath");
      const featAction = feature.action as typeof action;
      featAction();
      expect(feature).toBeDefined();
      expect(feature.action).toBeDefined();
      expect(feature.action).toHaveBeenCalled();
      expect(feature.path).toBe("filepath");
    });
    it("should attach a feature scope with a filepath and action", () => {
      const sut = new GlobalScope(vi.fn(), registry);
      const feature = sut.Feature("filepath");
      expect(feature).toBeDefined();
      expect(feature.action?.name).toEqual("Empty_Function");
      expect(feature.path).toBe("filepath");
    });
  });
});
