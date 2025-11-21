import { Then } from "../step-definitions";
import { assertDefined, assertStrictEqual } from "../utils/assertions";
import type { StepLifecycleStatus } from "../world";

Then("the lifecycle should have recorded {int} feature setup runs", function (expected: number) {
  assertStrictEqual(
    this.lifecycle.beforeFeatureRuns,
    expected,
    `Expected ${expected} beforeFeature hook run(s) but found ${this.lifecycle.beforeFeatureRuns}.`
  );
});

Then("the lifecycle scenario order should equal:", function () {
  const table = this.runtime.requireTable("horizontal");
  const expected = table.records<{ scenario: string }>().map((record) => String(record.scenario));

  assertStrictEqual(
    this.lifecycle.scenarioOrder.length,
    expected.length,
    `Expected ${expected.length} scenario entries but found ${this.lifecycle.scenarioOrder.length}.`
  );

  for (let index = 0; index < expected.length; index += 1) {
    const actual = this.lifecycle.scenarioOrder[index];
    const anticipated = expected[index];
    assertStrictEqual(
      actual,
      anticipated,
      `Scenario at position ${index + 1} should be "${anticipated}" but was "${actual}".`
    );
  }
});

Then("the lifecycle should record the following step outcomes:", function () {
  const table = this.runtime.requireTable("horizontal");
  const expected = table.records<{ step: string; status: StepLifecycleStatus }>();

  for (const { step, status } of expected) {
    const record = assertDefined(
      this.lifecycle.stepHistory.find((entry) => entry.step === step),
      `Expected lifecycle history to contain step "${step}".`
    );
    assertStrictEqual(
      record.status,
      status,
      `Expected step "${step}" to have status "${status}" but received "${record.status}".`
    );
  }
});
