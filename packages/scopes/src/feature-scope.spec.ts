import {
  CucumberExpression,
  ParameterTypeRegistry,
} from "@cucumber/cucumber-expressions";
import { describe, it, expect, vi } from "vitest";
import { HookCache } from "./caches";
import { FeatureScope } from "./feature-scope";
import { ScenarioScope } from "./scenario-scope";
import { StepScope } from "./step-scope";

describe("FeatureScope", () => {
  describe("constructor", () => {
    it("should set the name and path", () => {
      const hooks = new HookCache();
      const sut = new FeatureScope("name", vi.fn(), hooks);
      expect(sut.idString).toBe("name");
      expect(sut.path).toBe("name");
    });
  });
  describe("attach", () => {
    it("should fail to attach a feature scope", () => {
      const hooks = new HookCache();
      const sut = new FeatureScope("name", vi.fn(), hooks);
      const child = new FeatureScope("name", vi.fn(), hooks);
      expect(() => sut.attach(child)).toThrowError();
    });
    it("should attach a StepScope", () => {
      const hooks = new HookCache();
      const sut = new FeatureScope("name", vi.fn(), hooks);
      const child = new StepScope(
        "Given",
        "Context",
        new CucumberExpression("hi", new ParameterTypeRegistry()),
        vi.fn()
      );
      sut.attach(child);
      expect(sut.closedScopes).toContain(child);
    });
    it("should attach a ScenarioScope", () => {
      const hooks = new HookCache();
      const sut = new FeatureScope("name", vi.fn(), hooks);
      const child = new ScenarioScope("name", vi.fn(), hooks);
      sut.attach(child);
      expect(sut.closedScopes).toContain(child);
    });
  });
});
