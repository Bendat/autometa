import { CucumberRunner } from "@autometa/runner";

interface SimpleWorld {
  value: number;
  result: number | undefined;
}

const worldDefaults: Partial<SimpleWorld> = {
  value: 0,
  result: undefined,
};

const runner = CucumberRunner.builder()
  .withWorld<SimpleWorld>(worldDefaults);

export const stepsEnvironment = runner.steps();

export const {
  Given,
  When,
  Then,
  And,
  But,
  BeforeScenario,
  AfterScenario,
  BeforeFeature,
  AfterFeature,
} = stepsEnvironment;

// Simple arithmetic steps for testing
Given("I have the number {int}", (value: number, world: SimpleWorld) => {
  world.result = value;
});

When("I add {int}", (value: number, world: SimpleWorld) => {
  world.result = (world.result ?? 0) + value;
});

When("I multiply by {int}", (value: number, world: SimpleWorld) => {
  world.result = (world.result ?? 0) * value;
});

Then("the result should be {int}", (expected: number, world: SimpleWorld) => {
  if (world.result !== expected) {
    throw new Error(`Expected ${expected} but got ${world.result}`);
  }
});

// String steps
Given("I have the text {string}", (_text: string, _world: SimpleWorld) => {
  // Store text (simplified for demo)
});

Then("the text should contain {string}", (_substring: string, _world: SimpleWorld) => {
  // Check text (simplified for demo)
});

// Lifecycle hooks for debugging
BeforeFeature(({ scope, log }) => {
  log?.(`Starting feature: ${scope.name}`);
});

AfterFeature(({ scope, log }) => {
  log?.(`Finished feature: ${scope.name}`);
});

BeforeScenario(({ scope, log }) => {
  log?.(`Starting scenario: ${scope.name}`);
});

AfterScenario(({ scope, log }) => {
  log?.(`Finished scenario: ${scope.name}`);
});
