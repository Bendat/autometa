import { After, Given, Pass } from "autometa-runner";

Given("the outer background executed", ({ report }) => {
  report.outterbackgroundstep = true;
});

Given("the outer scenario executed", ({ report }) => {
  report.outterscenario1step = true;
});

Given("the outer scenario 2 executed", ({ report }) => {
  report.outterscenario2step = true;
});

Given("I execute the outer scenario with {int}", (num, { report }) => {
  report.outerscenariooutlinestep += num;
});

Given("the outer skipped scenario executed", ({ report }) => {
  report.skippedouterscenariostep = true;
});

Given("the rule1 background executed", ({ report }) => {
  report.rule1backgroundstep = true;
});

Given("the rule1 scenario executed", ({ report }) => {
  report.rule1scenariostep = true;
});

Given("the rule2 background executed", ({ report }) => {
  report.rule2backgroundstep = true;
});

Given("the rule2 scenario executed", ({ report }) => {
  report.rule2scenariostep = true;
});

Given("the rule2 skipped scenario executed", ({ report }) => {
  report.rule2skippedscenario = true;
});

Given("a rule scenario outline", Pass);
After(
  "verify outerscenario",
  ({ report }) => {
    expect(report.outterscenario1step).toBe(true);
  },
  "@test1"
);

After(
  "verify outerscenariooutline",
  ({ report }) => {
    expect(report.outerscenariooutlinestep).toBe(1);
  },
  "@test2"
);

After(
  "verify outerscenario2",
  ({ report }) => {
    expect(report.outterscenario2step).toBe(true);
  },
  "@test3"
);

After(
  "rule1scenario",
  ({ report }) => {
    expect(report.rule1scenariostep).toBe(true);
  },
  "@test4"
);

After(
  "rule2scenario",
  ({ report }) => {
    expect(report.rule2scenariostep).toBe(true);
  },
  "@test5"
);
