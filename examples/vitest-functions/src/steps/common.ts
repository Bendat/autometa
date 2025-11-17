import type { RunnerStepsSurface } from "@autometa/runner";

import {
  disposeStream,
  resetScenarioState,
  type BrewBuddyWorld,
} from "../world";
import { performRequest } from "../utils/http";
import { assertStatus } from "../utils/assertions";

export function registerCommonSteps(environment: RunnerStepsSurface<BrewBuddyWorld>): void {
  environment.BeforeScenario(({ world }: { world: BrewBuddyWorld }) => {
    resetScenarioState(world);
  });

  environment.AfterScenario(({ world }: { world: BrewBuddyWorld }) => {
    disposeStream(world);
  });

  environment.Given("the Brew Buddy API base URL is configured", async (world: BrewBuddyWorld) => {
    await performRequest(world, "get", "/health");
    assertStatus(world, 200);
  });

  environment.Given("the Brew Buddy menu is reset to the default offerings", async (world: BrewBuddyWorld) => {
    await performRequest(world, "post", "/admin/reset", {
      body: { scopes: ["menu", "recipes", "inventory", "loyalty", "orders"] },
    });
    assertStatus(world, 204);
  });

  environment.Given("the order queue is cleared", async (world: BrewBuddyWorld) => {
    await performRequest(world, "post", "/admin/reset", {
      body: { scopes: ["orders"] },
    });
    assertStatus(world, 204);
  });
}
