import { ParameterTypeRegistry } from "@cucumber/cucumber-expressions";
import { describe, expect, it, vi } from "vitest";
import { GlobalScope } from "./global-scope";
import { Scope } from "./scope";
import { Timeout } from "./timeout";
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
    it("should attach a feature scope with a filepath action and numeric timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = action;
      const feature = sut.Feature(action, "filepath", 1000);
      expect(feature).toBeDefined();
      expect(feature.action).toBeDefined();
      expect(feature.action).toHaveBeenCalled();
      expect(feature.path).toBe("filepath");
      expect(feature.timeout).toEqual(Timeout.from(1000));
    });
    it("should attach a feature scope with a filepath action and timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = action;
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      expect(feature).toBeDefined();
      expect(feature.action).toBeDefined();
      expect(feature.action).toHaveBeenCalled();
      expect(feature.path).toBe("filepath");
      expect(feature.timeout).toEqual(Timeout.from([1, "s"]));
    });
  });
  describe("rule", () => {
    it("should attach a rule scope with a name and action", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      sut.openChild = feature;
      const rule = sut.Rule("name", action);
      expect(rule.action).toBeDefined();
      expect(rule.name).toBe("name");
    });
    it("should attach a rule scope with a name action and numeric timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", 1000);
      sut.openChild = feature;
      const rule = sut.Rule("name", action, 1000);
      expect(rule.action).toBeDefined();
      expect(rule.name).toBe("name");
      expect(rule.timeout).toEqual(Timeout.from(1000));
    });
    it("should attach a rule scope with a name action and timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      sut.openChild = feature;
      const rule = sut.Rule("name", action, [1, "s"]);
      expect(rule.action).toBeDefined();
      expect(rule.name).toBe("name");
      expect(rule.timeout).toEqual(Timeout.from([1, "s"]));
    });
  });
  describe("Scenario", () => {
    it("should attach a scenario scope with a name and action", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      sut.openChild = feature;
      const scenario = sut.Scenario("name", action);
      expect(scenario.action).toBeDefined();
      expect(scenario.name).toBe("name");
    });
    it("should attach a scenario scope with a name action and numeric timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", 1000);
      sut.openChild = feature;
      const scenario = sut.Scenario("name", action, 1000);
      expect(scenario.action).toBeDefined();
      expect(scenario.name).toBe("name");
      expect(scenario.timeout).toEqual(Timeout.from(1000));
    });
    it("should attach a scenario scope with a name action and timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      sut.openChild = feature;
      const scenario = sut.Scenario("name", action, [1, "s"]);
      expect(scenario.action).toBeDefined();
      expect(scenario.name).toBe("name");
      expect(scenario.timeout).toEqual(Timeout.from([1, "s"]));
    });
  });
  describe("ScenarioOutline", () => {
    it("should attach a scenario outline scope with a name and action", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      sut.openChild = feature;
      const scenario = sut.ScenarioOutline("name", action);
      expect(scenario.action).toBeDefined();
      expect(scenario.name).toBe("name");
    });
    it("should attach a scenario outline scope with a name action and numeric timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", 1000);
      sut.openChild = feature;
      const scenario = sut.ScenarioOutline("name", action, 1000);
      expect(scenario.action).toBeDefined();
      expect(scenario.name).toBe("name");
      expect(scenario.timeout).toEqual(Timeout.from(1000));
    });
    it("should attach a scenario outline scope with a name action and timeout", () => {
      const action = vi.fn();
      const sut = new GlobalScope(new ParameterTypeRegistry());
      sut.onFeatureExecuted = vi.fn();
      const feature = sut.Feature(action, "filepath", [1, "s"]);
      sut.openChild = feature;
      const scenario = sut.ScenarioOutline("name", action, [1, "s"]);
      expect(scenario.action).toBeDefined();
      expect(scenario.name).toBe("name");
      expect(scenario.timeout).toEqual(Timeout.from([1, "s"]));
    });
  });
  describe("Steps", () => {
    describe("Given", () => {
      it("should attach a Given step", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath", [1, "s"]);
        sut.openChild = feature;
        const step = sut.Given("name", action);
        expect(step.action).toBeDefined();
        expect(step.expression.source).toBe("name");
      });
    });
    describe("When", () => {
      it("should attach a When step", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath", [1, "s"]);
        sut.openChild = feature;
        const step = sut.When("name", action);
        expect(step.action).toBeDefined();
        expect(step.expression.source).toBe("name");
      });
    });
    describe("Then", () => {
      it("should attach a Then step", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const step = sut.Given("name", action);
        expect(step.action).toBeDefined();
        expect(step.expression.source).toBe("name");
      });
    });
  });
  describe("hooks", () => {
    describe("Before", () => {
      it("should attach a Before hook with a name and action", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Before("test hook", action);
        expect(hook.action).toBeDefined();
      });

      it("should attach a Before hook with a name action and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Before("test hook", action, 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
      });

      it("should attach a Before hook with a name action and timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Before("test hook", action, [1, "s"]);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from([1, "s"]));
      });

      it("should attach a Before hook with a filter expression", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Before("test hook", action, "@tag");
        expect(hook.action).toBeDefined();
        expect(hook.options.tagFilter).toBe("@tag");
      });

      it("should attach a Before hook with a filter expression and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Before("test hook", action, "@tag", 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
        expect(hook.options.tagFilter).toBe("@tag");
      });

      it("should attach a Before hook with a filter expression and timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Before("test hook", action, "@tag", [1, "s"]);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from([1, "s"]));
        expect(hook.options.tagFilter).toBe("@tag");
      });
    });

    describe("After", () => {
      it("should attach an After hook with a name and action", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.After("test hook", action);
        expect(hook.action).toBeDefined();
      });

      it("should attach an After hook with a name action and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.After("test hook", action, 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
      });

      it("should attach an After hook with a name action and timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.After("test hook", action, [1, "s"]);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from([1, "s"]));
      });

      it("should attach an After hook with a filter expression", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.After("test hook", action, "@tag");
        expect(hook.action).toBeDefined();
        expect(hook.options.tagFilter).toBe("@tag");
      });

      it("should attach an After hook with a filter expression and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.After("test hook", action, "@tag", 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
        expect(hook.options.tagFilter).toBe("@tag");
      });

      it("should attach an After hook with a filter expression and timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.After("test hook", action, "@tag", [1, "s"]);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from([1, "s"]));
        expect(hook.options.tagFilter).toBe("@tag");
      });
    });

    describe("Setup", () => {
      it("should attach a Setup hook with a name and action", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Setup("test hook", action);
        expect(hook.action).toBeDefined();
      });

      it("should attach a Setup hook with a name action and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Setup("test hook", action, 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
      });

      it("should attach a Setup hook with a name action and timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Setup("test hook", action, [1, "s"]);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from([1, "s"]));
      });

      it("should attach a Setup hook with a filter expression", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Setup("test hook", action, "@tag");
        expect(hook.action).toBeDefined();
        expect(hook.options.tagFilter).toBe("@tag");
      });

      it("should attach a Setup hook with a filter expression and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Setup("test hook", action, "@tag", 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
        expect(hook.options.tagFilter).toBe("@tag");
      });
    });
    describe("Teardown", () => {
      it("should attach a Teardown hook with a name and action", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Teardown("test hook", action);
        expect(hook.action).toBeDefined();
      });
      it("should attach a Teardown hook with a name action and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Teardown("test hook", action, 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from(1000));
      });
      it("should attach a Teardown hook with a name action and timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Teardown("test hook", action, [1, "s"]);
        expect(hook.action).toBeDefined();
        expect(hook.options.timeout).toEqual(Timeout.from([1, "s"]));
      });
      it("should attach a Teardown hook with a filter expression", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Teardown("test hook", action, "@tag");
        expect(hook.action).toBeDefined();
        expect(hook.options.tagFilter).toBe("@tag");
      });
      it("should attach a Teardown hook with a filter expression and numeric timeout", () => {
        const action = vi.fn();
        const sut = new GlobalScope(new ParameterTypeRegistry());
        sut.onFeatureExecuted = vi.fn();
        const feature = sut.Feature(action, "filepath");
        sut.openChild = feature;
        const hook = sut.Teardown("test hook", action, "@tag", 1000);
        expect(hook.action).toBeDefined();
        expect(hook.options.tagFilter).toBe("@tag");
      });
    });
  });
});
