import { AfterScenario, BeforeScenario, Given } from "../step-definitions";

import { disposeStream, resetScenarioState, type BrewBuddyWorld } from "../world";
import { performRequest } from "../utils/http";
import { assertStatus } from "../utils/assertions";

BeforeScenario(({ world }: { world: BrewBuddyWorld }) => {
  resetScenarioState(world);
});

AfterScenario(({ world }: { world: BrewBuddyWorld }) => {
  disposeStream(world);
});

Given("the Brew Buddy API base URL is configured", async (world: BrewBuddyWorld) => {
  await performRequest(world, "get", "/health");
  assertStatus(world, 200);
});

Given("the Brew Buddy menu is reset to the default offerings", async (world: BrewBuddyWorld) => {
  await performRequest(world, "post", "/admin/reset", {
    body: { scopes: ["menu", "recipes", "inventory", "loyalty", "orders"] },
  });
  assertStatus(world, 204);
});

Given("the order queue is cleared", async (world: BrewBuddyWorld) => {
  await performRequest(world, "post", "/admin/reset", {
    body: { scopes: ["orders"] },
  });
  assertStatus(world, 204);
});
