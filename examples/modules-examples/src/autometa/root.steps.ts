import { installCommonSteps } from "./common.steps";
import { baseRunner, type BaseWorld } from "./base-runner";

export type { BaseWorld } from "./base-runner";

/**
 * Root (hoisted) steps environment.
 *
 * Features outside any group/module will use this environment by default.
 */
const runner = baseRunner.fork();

export const stepsEnvironment = runner.steps();
installCommonSteps(stepsEnvironment);

export const { Given, When, Then, And, But, ensure } = stepsEnvironment;

// Example root step used by hoisted features.
Given("the root steps are loaded", (world: BaseWorld) => {
  world.state["root:loaded"] = true;
});
