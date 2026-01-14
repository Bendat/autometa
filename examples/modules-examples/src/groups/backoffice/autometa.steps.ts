import { installCommonSteps } from "../../autometa/common.steps";
import { baseRunner, type BaseWorld } from "../../autometa/base-runner";
import type { BackofficeWorld } from "./world";

export type { BaseWorld } from "../../autometa/base-runner";

type BackofficeRunnerWorld = BaseWorld & BackofficeWorld;

const runner = baseRunner.group("backoffice").extendWorld<BackofficeWorld>({
  backoffice: { seen: [] },
});

export const stepsEnvironment = runner.steps();
installCommonSteps(stepsEnvironment);

export const { Given, When, Then, And, But, ensure } = stepsEnvironment;

Given("the backoffice steps are loaded", function (this: BackofficeRunnerWorld) {
  this.backoffice.seen.push("loaded");
});
