import { CucumberRunner } from "@autometa/core/runner";

export interface BackofficeWorld {
  readonly state: Record<string, unknown>;
  readonly backoffice: {
    loaded: boolean;
  };
}

const runner = CucumberRunner.builder<BackofficeWorld>().withWorld({
  state: {},
  backoffice: { loaded: false },
});

export const stepsEnvironment = runner.steps();
export const { Given, Then, And, ensure } = stepsEnvironment;

Given("the backoffice steps are loaded", function (this: BackofficeWorld) {
  this.backoffice.loaded = true;
});

Then("the backoffice steps should be available", function (this: BackofficeWorld) {
  ensure(this.backoffice.loaded).toStrictEqual(true);
});
