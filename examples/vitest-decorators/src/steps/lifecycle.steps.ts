import {
  Binding,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import type { BrewBuddyWorld, LifecycleStepRecord, StepLifecycleStatus } from "../world";

@Binding()
export class LifecycleSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @Then("the lifecycle should have recorded {int} feature setup runs")
  lifecycleRecordedFeatureSetups(expected: number): void {
    ensure(this.world.lifecycle.beforeFeatureRuns, {
      label: `Expected ${expected} beforeFeature hook run(s) but found ${this.world.lifecycle.beforeFeatureRuns}.`,
    }).toStrictEqual(expected);
  }

  @Then("the lifecycle scenario order should equal:")
  lifecycleScenarioOrderEquals(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expected = table.records<{ scenario: string }>().map((record) => String(record.scenario));

    ensure(this.world.lifecycle.scenarioOrder.length, {
      label: `Expected ${expected.length} scenario entries but found ${this.world.lifecycle.scenarioOrder.length}.`,
    }).toStrictEqual(expected.length);

    for (let index = 0; index < expected.length; index += 1) {
      const actual = this.world.lifecycle.scenarioOrder[index];
      const anticipated = expected[index];
      ensure(actual, {
        label: `Scenario at position ${index + 1} should be "${anticipated}" but was "${actual}".`,
      }).toStrictEqual(anticipated);
    }
  }

  @Then("the lifecycle should record the following step outcomes:")
  lifecycleRecordsStepOutcomes(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expected = table.records<{ step: string; status: StepLifecycleStatus }>();

    for (const { step, status } of expected) {
      const record = ensure(
        this.world.lifecycle.stepHistory.find((entry) => entry.step === step),
        { label: `Expected lifecycle history to contain step "${step}".` }
      ).toBeDefined().value as LifecycleStepRecord;
      ensure(record.status, {
        label: `Expected step "${step}" to have status "${status}" but received "${record.status}".`,
      }).toStrictEqual(status);
    }
  }
}
