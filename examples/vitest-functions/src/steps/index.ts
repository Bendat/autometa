import type { RunnerStepsSurface } from "@autometa/runner";

import type { BrewBuddyWorld } from "../world";
import { registerCommonSteps } from "./common";
import { registerHttpSteps } from "./requests";
import { registerMenuSteps } from "./menu";

export function registerAllSteps(environment: RunnerStepsSurface<BrewBuddyWorld>): void {
  registerCommonSteps(environment);
  registerHttpSteps(environment);
  registerMenuSteps(environment);
}
