import { CucumberRunner } from "@autometa/runner";

const runner = CucumberRunner.builder();

export const stepsEnvironment = runner.steps();

const { Given, Then } = stepsEnvironment;

Given("a module-scoped feature exists", () => {
  // no-op setup for demonstration
});

Then("it should be discovered via module-relative roots", () => {
  // assertion-free demo step
});
