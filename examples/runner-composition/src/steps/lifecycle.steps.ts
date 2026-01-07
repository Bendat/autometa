import { Then, When, ensure } from "../step-definitions";
import type { RunnerCompositionWorld } from "../world";

When("I request the menu listing", async (world: RunnerCompositionWorld) => {
  await world.app.perform("get", "/menu");
});

Then(
  "the lifecycle should have recorded {int} feature setup runs",
  (runs: number, world: RunnerCompositionWorld) => {
    ensure(world.lifecycle.beforeFeatureRuns, { label: "beforeFeatureRuns" }).toStrictEqual(runs);
  }
);

Then(
  "the lifecycle scenario order should equal:",
  (world: RunnerCompositionWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const expected = table
      .records()
      .map((record) => String(record.scenario ?? "").trim())
      .filter(Boolean);

    ensure(world.lifecycle.scenarioOrder, { label: "scenarioOrder" }).toStrictEqual(expected);
  }
);

Then(
  "the lifecycle should record the following step outcomes:",
  (world: RunnerCompositionWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const expected = table.records().map((record) => {
      return {
        step: String(record.step ?? ""),
        status: String(record.status ?? ""),
      };
    });

    for (const expectation of expected) {
      const match = world.lifecycle.stepHistory.find(
        (entry) => entry.step.trim() === expectation.step.trim()
      );
      ensure(match, { label: `step outcome ${expectation.step}` }).toBeDefined();
      ensure(match!.status, { label: `status for ${expectation.step}` }).toStrictEqual(
        expectation.status
      );
    }
  }
);
