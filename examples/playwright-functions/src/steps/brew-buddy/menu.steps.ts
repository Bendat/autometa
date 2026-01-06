import type { TableRecord, TableValue } from "@autometa/gherkin";
import { Given, Then, When, ensure } from "../../autometa/steps";
import type { MenuItem } from "../../../../.api/src/types/domain.js";
import { type BrewBuddyWorld } from "../../world";
import type {
  MenuFieldInput,
  MenuPriceUpdate,
} from "../../brew-buddy/capabilities/menu/menu.service";

class MenuExpectation {
  name = "";
  price = 0;
  size = "";
}

type MenuFieldRow = TableRecord & {
  readonly field: string;
  readonly value: TableValue;
};

type PriceUpdateRow = TableRecord & {
  readonly name: string;
  readonly price: number;
};

When("I request the menu listing", async (world) => {
  await world.app.menu.requestListing();
});

Then("the menu should include the default drinks", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const expectations = table.asInstances(MenuExpectation);
  const items = ensureMenuItems(world);
  for (const expectation of expectations) {
    const item = findMenuItem(world, items, expectation.name);
    ensure(item.price, {
      label: `Price mismatch for ${expectation.name}.`,
    }).toBeCloseTo(expectation.price, 2);
    ensure(item.size, {
      label: `Size mismatch for ${expectation.name}.`,
    }).toStrictEqual(expectation.size);
  }
});

Then("the menu should contain at least one item", (world) => {
  const items = ensureMenuItems(world);
  ensure(items.length > 0, {
    label: "Menu should contain at least one item.",
  }).toBeTruthy();
});

Given("I create a seasonal drink named {string}", async (name, world) => {
  const fields = world.runtime
    .requireTable("horizontal")
    .records<MenuFieldRow>();
  const inputs: MenuFieldInput[] = fields.map((row) => ({
    field: String(row.field),
    value: row.value,
  }));

  await world.app.menu.createSeasonalDrink(name, inputs);
  ensure.response.hasStatus(201);
});

Then(
  "the menu should include an item named {string} with price {float} and size {string}",
  (name, price, size, world) => {
    const items = ensureMenuItems(world);
    const item = findMenuItem(world, items, name);
    ensure(item.price, {
      label: `Price mismatch for ${name}.`,
    }).toBeCloseTo(price, 2);
    ensure(item.size, {
      label: `Size mismatch for ${name}.`,
    }).toStrictEqual(size);
    world.app.memory.rememberLastMenuItem(item);
  }
);

Then("the seasonal flag should be set to true", (world) => {
  const item = ensure(world.scenario.lastMenuItem, {
    label: "No menu item stored for assertion",
  })
    .toBeDefined()
    .value as MenuItem;
  ensure(item.seasonal, {
    label: "Seasonal flag should be true.",
  }).toStrictEqual(true);
});

Given(
  "a menu item named {string} exists for season {string}",
  async (name, season, world) => {
    const payload = {
      name,
      price: 6,
      size: "12oz",
      season,
      description: `${name} seasonal special`,
    } satisfies Partial<MenuItem> & {
      name: string;
      price: number;
      size: string;
      season: string;
    };
    await world.app.withHistory(world.app.menuClient.create(payload));
    ensure.response.hasStatus(201);
  }
);

When("I retire the drink named {string}", async (name, world) => {
  await world.app.menu.retireDrink(name);
  ensure.response.hasStatus(204);
});

Then("the menu should not include {string}", async (name, world) => {
  const items = await world.app.menu.requestListing();
  ensure(
    items.some((item) => item.name.toLowerCase() === name.toLowerCase()),
    { label: `Menu should not include ${name}.` }
  ).toBeFalsy();
});

Given("the following menu price changes are pending", (world) => {
  const records = world.runtime
    .requireTable("horizontal")
    .records<PriceUpdateRow>();
  world.scenario.priceUpdates = records.map((record) => ({
    name: String(record.name),
    price: Number(record.price),
  }));
});

When("I apply the bulk price update", async (world) => {
  const updates = world.scenario.priceUpdates ?? [];
  await world.app.menu.applyBulkPriceUpdate(updates as MenuPriceUpdate[]);
  ensure.response.hasStatus(200);
});

Then("each price change should be reflected in the latest menu", (world) => {
  const updates = world.scenario.priceUpdates ?? [];
  const items = ensureMenuItems(world);
  for (const update of updates) {
    const item = findMenuItem(world, items, update.name);
    ensure(item.price, {
      label: `Price mismatch for ${update.name}.`,
    }).toBeCloseTo(update.price, 2);
  }
});

Given('the seasonal schedule for {menuRegion} is configured', (region, world) => {
  // Store selection on the scenario so parameter types can validate downstream.
  world.scenario.region = region;
});

When('I request the menu listing for {menuRegion}', async (region, world) => {
  await world.app.menu.requestListingForRegion(region);
});

Then('the regional menu should include {menuSelection}', (expectation, world) => {
  const snapshot = ensureMenuItems(world);
  const item = findMenuItem(world, snapshot, expectation.beverage);
  world.app.memory.rememberLastMenuItem(item);
});

Then('the seasonal flag should reflect {menuSeasonal}', (expected, world) => {
  const resolved = ensure(world.scenario.lastMenuItem, {
    label: "No menu item stored for seasonal assertion",
  })
    .toBeDefined()
    .value as MenuItem;
  ensure(resolved.seasonal, {
    label: "Seasonal flag mismatch.",
  }).toStrictEqual(expected);
});

Then("the menu snapshot should be available on the world context", (world) => {
  const snapshot = world.scenario.menuSnapshot ?? [];
  ensure(Array.isArray(snapshot), {
    label: "Menu snapshot should be stored as an array.",
  }).toBeTruthy();
});

Then("the last tracked menu item should be {string}", (name, world) => {
  ensure(world.scenario.lastMenuItem?.name, {
    label: "Scenario item mismatch on world context.",
  }).toStrictEqual(name);
});

function ensureMenuItems(world: BrewBuddyWorld): MenuItem[] {
  return world.app.menu.snapshot();
}

function findMenuItem(
  world: BrewBuddyWorld,
  items: MenuItem[],
  name: string
): MenuItem {
  return ensure(
    items.find((item) => item.name.toLowerCase() === name.toLowerCase()),
    { label: `Menu item ${name} not found` }
  )
    .toBeDefined()
    .value as MenuItem;
}

// Use `ensure(value).toBeCloseTo(expected, precision)` from `@autometa/assertions`
// instead of bespoke numeric assertions.
