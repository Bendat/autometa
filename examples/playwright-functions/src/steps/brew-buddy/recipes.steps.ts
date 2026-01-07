import { Given, Then, ensure } from "../../autometa/steps";
import type { BrewBuddyWorld } from "../../world";

Given("a recipe exists named {string}", async (name: string, world: BrewBuddyWorld) => {
  await world.app.arrangeRecipes.ensureExists(name);
  ensure.response.hasStatus([200, 201]);
});

Then(
  "the recipe {string} should not be present when I list recipes",
  async (name: string, world: BrewBuddyWorld) => {
    await world.app.history.track(world.app.recipes.list());
    ensure.response.hasStatus(200);

    ensure.recipes.doesNotContain(name);
  }
);
