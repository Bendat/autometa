import {
  After,
  Before,
  Rule,
  Scenario,
  ScenarioOutline,
  Setup,
  Teardown,
} from "@autometa/cucumber-runner";
import { Feature } from "@autometa/cucumber-runner";
import { Given, Pass } from "@autometa/cucumber-runner";
import { expect } from "@jest/globals";
const results = {
  base: {
    setupCalled: false,
    beforeCalled: false,
    afterCalled: false,
    tearDownCalled: false,
  },
  OuterOutline: {
    setupCalled: false,
    beforeCalled: false,
    afterCalled: false,
    tearDownCalled: false,
  },
  rule: {
    setupCalled: false,
    beforeCalled: false,
    afterCalled: false,
    tearDownCalled: false,
    ruleOutline: {
      setupCalled: false,
      beforeCalled: false,
      afterCalled: false,
      tearDownCalled: false,
    },
  },
};
Setup("Outer setup", (app) => {
  results.base.setupCalled = true;
});
Before("Outer before", () => {
  results.base.beforeCalled = true;
});
After("Outer After", () => {
  results.base.afterCalled = true;
});
Teardown("Outer Teardown", (app) => {
  results.base.tearDownCalled = true;
  expect(results.OuterOutline.tearDownCalled).toBe(true);
  expect(results.rule.ruleOutline.tearDownCalled).toBe(true);
});
After("beardown", () => console.error("Running"), "@skipHook");
Feature(() => {
  Scenario("Outer Hook Scenario", () => {
    Given("a scenario with hooks", () => {
      expect(results.base.setupCalled).toBe(true);
      expect(results.base.beforeCalled).toBe(true);
    });
  });
  ScenarioOutline("Outer Hook Scenario Outline", () => {
    Setup("Outer Outline setup", () => {
      results.OuterOutline.setupCalled = true;
    });
    Before("Outer Outline before", () => {
      results.OuterOutline.beforeCalled = true;
    });
    After("Outer Outline After", () => {
      results.OuterOutline.afterCalled = true;
    });
    Teardown("Outer Outline Teardown", () => {
      results.OuterOutline.tearDownCalled = true;
    });
    Given("a scenario with hooks", () => {
      expect(results.base.afterCalled).toBe(true);
      expect(results.OuterOutline.setupCalled).toBe(true);
      expect(results.OuterOutline.beforeCalled).toBe(true);
    });
  });
  Rule("A Rule with hooks", () => {
    Setup("Rule setup", () => {
      results.rule.setupCalled = true;
    });
    Before("Rule before", () => {
      results.rule.beforeCalled = true;
    });
    After("Rule After", () => {
      results.rule.afterCalled = true;
    });
    Teardown("Rule Teardown", () => {
      results.rule.tearDownCalled = true;
    });
    Scenario("Inner Hook Scenario", () => {
      Given("a scenario with hooks", () => {
        expect(results.OuterOutline.afterCalled).toBe(true);
        expect(results.rule.beforeCalled).toBe(true);
        expect(results.rule.setupCalled).toBe(true);
      });
    });
    ScenarioOutline("Inner Hook Scenario Outline", () => {
      Setup("Rule outline setup", () => {
        results.rule.ruleOutline.setupCalled = true;
      });
      Before("Rule outline before", () => {
        results.rule.ruleOutline.beforeCalled = true;
      });
      After("Rule outline After", () => {
        results.rule.ruleOutline.afterCalled = true;
      });
      Teardown("Rule outline Teardown", () => {
        results.rule.ruleOutline.tearDownCalled = true;
      });
      Given("a scenario with hooks", () => {
        expect(results.base.afterCalled).toBe(true);
        expect(results.base.beforeCalled).toBe(true);
        expect(results.rule.ruleOutline.beforeCalled).toBe(true);
        expect(results.rule.ruleOutline.setupCalled).toBe(true);
      });
    });
  });
}, "./hooks.feature");
