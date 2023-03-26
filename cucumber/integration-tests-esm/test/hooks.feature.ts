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
  outterOutline: {
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
Setup("Outter setup", () => {
  results.base.setupCalled = true;
});
Before("Outter before", () => {
  results.base.beforeCalled = true;
});
After("Outter After", () => {
  results.base.afterCalled = true;
});
Teardown("Outter Teardown", () => {
  results.base.tearDownCalled = true;
  expect(results.outterOutline.tearDownCalled).toBe(true);
  expect(results.rule.ruleOutline.tearDownCalled).toBe(true);
});
Feature(() => {
  Scenario("Outter Hook Scenario", () => {
    Given("a scenario with hooks", () => {
      expect(results.base.setupCalled).toBe(true);
      expect(results.base.beforeCalled).toBe(true);
    });
  });
  ScenarioOutline("Outter Hook Scenario Outline", () => {
    Setup("Outter Outline setup", () => {
      results.outterOutline.setupCalled = true;
    });
    Before("Outter Outline before", () => {
      results.outterOutline.beforeCalled = true;
    });
    After("Outter Outline After", () => {
      results.outterOutline.afterCalled = true;
    });
    Teardown("Outter Outline Teardown", () => {
      results.outterOutline.tearDownCalled = true;
    });
    Given("a scenario with hooks", () => {
      expect(results.base.afterCalled).toBe(true);
      expect(results.outterOutline.setupCalled).toBe(true);
      expect(results.outterOutline.beforeCalled).toBe(true);
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
        expect(results.outterOutline.afterCalled).toBe(true);
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
