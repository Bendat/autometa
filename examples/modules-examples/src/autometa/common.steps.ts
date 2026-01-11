import type { RunnerStepsSurface } from "@autometa/runner";

import type { BaseWorld } from "./base-runner";

/**
 * Common steps that are intended to be available in every derived environment.
 *
 * This is an "installer" to avoid relying on global registries.
 */
export function installCommonSteps<World extends BaseWorld>(
  env: RunnerStepsSurface<World>
): void {
  const { Given } = env;

  Given("the common steps are loaded", function (this: World) {
    this.state["common:loaded"] = true;
  });
}
