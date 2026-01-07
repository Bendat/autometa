import { Given, Then, ensure } from "../../autometa/steps";
import type { BrewBuddyWorld } from "../../world";
import { parseInventory } from "../../brew-buddy/api/parsers";

Given(
  "the inventory for {string} is set to {int} drinks",
  async (item: string, quantity: number, world: BrewBuddyWorld) => {
    await world.app.history.track(world.app.inventory.update(item, { quantity }));
    ensure.response.hasStatus(200);

    const inventory = parseInventory(world.app.history.lastResponseBody);
    world.app.memory.rememberInventory(inventory);
    world.scenario.expectOrderFailure = quantity <= 0;
  }
);

Then(
  "the inventory for {string} is restored to {int} drinks",
  async (item: string, quantity: number, world: BrewBuddyWorld) => {
    await world.app.history.track(world.app.inventory.update(item, { quantity }));
    ensure.response.hasStatus(200);
  }
);
