import { baseRunner, type BaseWorld } from "../../autometa/base-runner";

export type { BaseWorld } from "../../autometa/base-runner";

const runner = baseRunner.group("api");

export const stepsEnvironment = runner.steps();
export const { Given, When, Then, And, But, ensure } = stepsEnvironment;

Given("the api group steps are loaded", function (this: BaseWorld) {
  this.state["api:seen"] = true;
});

