import {
  Feature,
  Given,
  Rule,
  Scenario,
  ScenarioOutline
} from "@autometa/runner";

Feature(() => {
  Given("the outer background executed", ({ report }) => {
    report.outterbackgroundstep = true;
  });
  Given("the outer scenario 2 executed", ({ report }) => {
    report.outterscenario2step = true;
  });
  Given("the outer skipped scenario executed", ({ report }) => {
    report.skippedouterscenariostep = true;
  });
  Given("the rule2 skipped scenario executed", ({ report }) => {
    report.rule2skippedscenario = true;
  });
  Scenario("outerscenario", () => {
    Given("the outer scenario executed", ({ report }) => {
      report.outterscenario1step = true;
    });
  });

  ScenarioOutline("outerscenariooutline", () => {
    Given("I execute the outer scenario with {int}", (num, { report }) => {
      report.outerscenariooutlinestep += num;
    });
  });

  Rule("rule1", () => {
    Given("the rule1 background executed", ({ report }) => {
      report.rule1backgroundstep = true;
    });
    Scenario("rule1scenario", () => {
      Given("the rule1 scenario executed", ({ report }) => {
        report.rule1scenariostep = true;
      });
    });
  });

  Rule("rule2", () => {
    Given("the rule2 background executed", ({ report }) => {
      report.rule2backgroundstep = true;
    });
    Scenario("rule2scenario", () => {
      Given("the rule2 scenario executed", ({ report }) => {
        report.rule2scenariostep = true;
      });
    });

    ScenarioOutline("Rule Scenario Outline <count>", () => {
      Given("a rule scenario outline", () => {
        // noop
      });
    });
  });
}, "../features/test9.feature");
