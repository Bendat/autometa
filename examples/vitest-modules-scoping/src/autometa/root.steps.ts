import { baseRunner, type BaseWorld } from "./base-runner";

export type { BaseWorld };

export const stepsEnvironment = baseRunner.steps();
export const { Given, When, Then, And, But, ensure } = stepsEnvironment;

Given("a root step exists", function (this: BaseWorld) {
  this.state["root:seen"] = true;
});

