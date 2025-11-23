import { Then, ensure } from "../step-definitions";
import type { LifecycleStepRecord, StepLifecycleStatus } from "../world";

Then(
  "the lifecycle should have recorded {int} feature setup runs",
  (expected, world) => {
    ensure(world)(world.lifecycle.beforeFeatureRuns, {
      label: `Expected ${expected} beforeFeature hook run(s) but found ${world.lifecycle.beforeFeatureRuns}.`,
    }).toStrictEqual(expected);
  }
);

Then("the lifecycle scenario order should equal:", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const expected = table.records<{ scenario: string }>().map((record) => String(record.scenario));

  ensure(world)(world.lifecycle.scenarioOrder.length, {
    label: `Expected ${expected.length} scenario entries but found ${world.lifecycle.scenarioOrder.length}.`,
  }).toStrictEqual(expected.length);

  for (let index = 0; index < expected.length; index += 1) {
    const actual = world.lifecycle.scenarioOrder[index];
    const anticipated = expected[index];
    ensure(world)(actual, {
      label: `Scenario at position ${index + 1} should be "${anticipated}" but was "${actual}".`,
    }).toStrictEqual(anticipated);
  }
});

Then("the lifecycle should record the following step outcomes:", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const expected = table.records<{ step: string; status: StepLifecycleStatus }>();

  for (const { step, status } of expected) {
    const record = ensure(world)(
      world.lifecycle.stepHistory.find((entry) => entry.step === step),
      { label: `Expected lifecycle history to contain step "${step}".` }
    )
      .toBeDefined()
      .value as LifecycleStepRecord;
    ensure(world)(record.status, {
      label: `Expected step "${step}" to have status "${status}" but received "${record.status}".`,
    }).toStrictEqual(status);
  }
});
