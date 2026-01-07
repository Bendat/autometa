import { Given, Then, ensure } from "../../autometa/steps";
import type { BrewBuddyWorld } from "../../world";
import type { LoyaltyAccount } from "../../../../.api/src/types/domain.js";
import { parseLoyalty } from "../../brew-buddy/domain/parsers";

Given(
  "a loyalty account exists for {string}",
  async (email: string, world: BrewBuddyWorld) => {
    await world.app.history.track(world.app.loyalty.update(email, { points: 0 }));
    ensure.response.hasStatus(200);

    const account = parseLoyalty(world.app.history.lastResponseBody);
    world.app.memory.rememberLoyalty(account);
  }
);

Then("the loyalty account should earn 10 points", async (world: BrewBuddyWorld) => {
  const loyalty = ensure(world.scenario.loyaltyAccount, {
    label: "No loyalty account is registered in the current scenario.",
  })
    .toBeDefined()
    .value as LoyaltyAccount;

  const baseline = loyalty.points;

  await world.app.history.track(world.app.loyalty.get(loyalty.email));
  ensure.response.hasStatus(200);

  const updated = parseLoyalty(world.app.history.lastResponseBody);
  ensure(updated.points, {
    label: `Expected loyalty account to gain 10 points (baseline ${baseline}).`,
  }).toStrictEqual(baseline + 10);

  world.app.memory.rememberLoyalty(updated);
});
