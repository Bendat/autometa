import { Then, When, ensure } from "../../autometa/steps";
import type { BrewBuddyWorld } from "../../world";

When(
  "I place an order for {string}",
  async (drink: string, world: BrewBuddyWorld) => {
    await world.app.ordering.placeOrderForDrink(drink);
  }
);

When("I place and pay for an order", async (world: BrewBuddyWorld) => {
  ensure.runtime.hasTable({
    label: "Order details table is required when placing and paying for an order.",
  });
  await world.app.ordering.placeAndPayFromTable();
});

Then(
  "the order response should include a preparation ticket",
  (world: BrewBuddyWorld) => {
    world.app.ordering.rememberTicketFromLastResponse();
  }
);

Then(
  "the order status should be {string}",
  async (status: string, world: BrewBuddyWorld) => {
    await world.app.ordering.assertOrderStatus(status);
  }
);

Then(
  "the order should record the milk as {string}",
  async (expected: string, world: BrewBuddyWorld) => {
    await world.app.ordering.assertMilk(expected);
  }
);

Then(
  "the order should record the sweetener as {string}",
  async (expected: string, world: BrewBuddyWorld) => {
    await world.app.ordering.assertSweetener(expected);
  }
);

Then(
  "the order should be rejected with status {int}",
  (status: number, world: BrewBuddyWorld) => {
    ensure.response.hasStatus(status);
    world.app.ordering.assertRejectedStatus(status);
  }
);

Then(
  "the rejection reason should be {string}",
  (reason: string, world: BrewBuddyWorld) => {
    world.app.ordering.assertRejectedReason(reason);
  }
);
