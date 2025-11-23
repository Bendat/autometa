import { Then, ensure } from "../step-definitions";
import type { BrewBuddyWorld, LifecycleStepRecord, StepLifecycleStatus } from "../world";

Then(
  "the lifecycle should have recorded {int} feature setup runs",
  function (this: BrewBuddyWorld, expected: number) {
    ensure(this)(this.lifecycle.beforeFeatureRuns, {
      label: `Expected ${expected} beforeFeature hook run(s) but found ${this.lifecycle.beforeFeatureRuns}.`,
    }).toStrictEqual(expected);
  }
);

Then("the lifecycle scenario order should equal:", function (this: BrewBuddyWorld) {
  const table = this.runtime.requireTable("horizontal");
  const expected = table.records<{ scenario: string }>().map((record) => String(record.scenario));

  ensure(this)(this.lifecycle.scenarioOrder.length, {
    label: `Expected ${expected.length} scenario entries but found ${this.lifecycle.scenarioOrder.length}.`,
  }).toStrictEqual(expected.length);

  for (let index = 0; index < expected.length; index += 1) {
    const actual = this.lifecycle.scenarioOrder[index];
    const anticipated = expected[index];
    ensure(this)(actual, {
      label: `Scenario at position ${index + 1} should be "${anticipated}" but was "${actual}".`,
    }).toStrictEqual(anticipated);
  }
});

Then("the lifecycle should record the following step outcomes:", function (this: BrewBuddyWorld) {
  const table = this.runtime.requireTable("horizontal");
  const expected = table.records<{ step: string; status: StepLifecycleStatus }>();

  for (const { step, status } of expected) {
    const record = ensure(this)(
      this.lifecycle.stepHistory.find((entry) => entry.step === step),
      { label: `Expected lifecycle history to contain step "${step}".` }
    )
      .toBeDefined()
      .value as LifecycleStepRecord;
    ensure(this)(record.status, {
      label: `Expected step "${step}" to have status "${status}" but received "${record.status}".`,
    }).toStrictEqual(status);
  }
});
