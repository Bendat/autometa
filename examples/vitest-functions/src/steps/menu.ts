import type { TableRecord, TableValue } from "@autometa/gherkin";

import { Given, Then, When, ensure } from "../step-definitions";
import type { MenuItem } from "../../../.api/src/types/domain.js";
import { type BrewBuddyWorld } from "../world";
import { performRequest } from "../utils/http";

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
  await performRequest(world, "get", "/menu");
  const items = extractMenuItems(world);
  world.app.memory.rememberMenuSnapshot(items);
});

Then("the menu should include the default drinks", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const expectations = table.asInstances(MenuExpectation);
  const items = ensureMenuItems(world);
  for (const expectation of expectations) {
    const item = findMenuItem(world, items, expectation.name);
    ensureCloseTo(
      world,
      item.price,
      expectation.price,
      2,
      `Price mismatch for ${expectation.name}.`
    );
    ensure(world)(item.size, {
      label: `Size mismatch for ${expectation.name}.`,
    }).toStrictEqual(expectation.size);
  }
});

Given("I create a seasonal drink named {string}", async (name, world) => {
  const fields = world.runtime
    .requireTable("horizontal")
    .records<MenuFieldRow>();
  const payload = buildMenuPayload(name, fields);
  await performRequest(world, "post", "/menu", { body: payload });
  ensure(world).response.hasStatus(201);
  const created = parseMenuItem(world);
  world.app.memory.rememberLastMenuItem(created);
  world.scenario.createdItems.push(created.name);
});

Then(
  "the menu should include an item named {string} with price {float} and size {string}",
  (name, price, size, world) => {
    const items = ensureMenuItems(world);
    const item = findMenuItem(world, items, name);
    ensureCloseTo(world, item.price, price, 2, `Price mismatch for ${name}.`);
    ensure(world)(item.size, {
      label: `Size mismatch for ${name}.`,
    }).toStrictEqual(size);
    world.app.memory.rememberLastMenuItem(item);
  }
);

Then("the seasonal flag should be set to true", (world) => {
  const item = ensure(world)(world.scenario.lastMenuItem, {
    label: "No menu item stored for assertion",
  })
    .toBeDefined()
    .value as MenuItem;
  ensure(world)(item.seasonal, {
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
    await performRequest(world, "post", "/menu", { body: payload });
    ensure(world).response.hasStatus(201);
  }
);

When("I retire the drink named {string}", async (name, world) => {
  await performRequest(world, "delete", `/menu/${encodeURIComponent(name)}`);
  ensure(world).response.hasStatus(204);
});

Then("the menu should not include {string}", async (name, world) => {
  await performRequest(world, "get", "/menu");
  const items = extractMenuItems(world);
  ensure(world)(
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
  await performRequest(world, "patch", "/menu/prices", { body: { updates } });
  ensure(world).response.hasStatus(200);
  const updated = extractMenuItems(world);
  world.app.memory.rememberMenuSnapshot(updated);
});

Then("each price change should be reflected in the latest menu", (world) => {
  const updates = world.scenario.priceUpdates ?? [];
  const items = ensureMenuItems(world);
  for (const update of updates) {
    const item = findMenuItem(world, items, update.name);
    ensureCloseTo(world, item.price, update.price, 2, `Price mismatch for ${update.name}.`);
  }
});

Given(
  'the seasonal schedule for {menuRegion} is configured',
  (region, world) => {
    world.scenario.region = region;
  }
);

When('I request the menu listing for {menuRegion}', async (region, world) => {
  world.scenario.region = region;
  await performRequest(world, "get", "/menu");
  const items = extractMenuItems(world);
  world.app.memory.rememberMenuSnapshot(items);
});

Then(
  'the regional menu should include {menuSelection}',
  (expectation, world) => {
    const snapshot = ensureMenuItems(world);
    const item = findMenuItem(world, snapshot, expectation.beverage);
    world.app.memory.rememberLastMenuItem(item);
  }
);

Then('the seasonal flag should reflect {menuSeasonal}', (expected, world) => {
  const resolved = ensure(world)(world.scenario.lastMenuItem, {
    label: "No menu item stored for seasonal assertion",
  })
    .toBeDefined()
    .value as MenuItem;
  ensure(world)(resolved.seasonal, {
    label: "Seasonal flag mismatch.",
  }).toStrictEqual(expected);
});

Then(
  "the menu snapshot should be available on the world context",
  (world) => {
    const snapshot = world.scenario.menuSnapshot ?? [];
    ensure(world)(Array.isArray(snapshot), {
      label: "Menu snapshot should be stored as an array.",
    }).toBeTruthy();
  }
);

Then(
  "the last tracked menu item should be {string}",
  (name, world) => {
    ensure(world)(world.scenario.lastMenuItem?.name, {
      label: "Scenario item mismatch on world context.",
    }).toStrictEqual(name);
  }
);

function extractMenuItems(world: BrewBuddyWorld): MenuItem[] {
  const body = world.app.lastResponseBody as { items?: MenuItem[] } | undefined;
  const items = Array.isArray(body?.items) ? body?.items ?? [] : [];
  return items.map((item) => ({ ...item }));
}

function ensureMenuItems(world: BrewBuddyWorld): MenuItem[] {
  const snapshot = world.scenario.menuSnapshot;
  if (!snapshot) {
    const items = extractMenuItems(world);
    world.app.memory.rememberMenuSnapshot(items);
    return items;
  }
  return snapshot;
}

function findMenuItem(world: BrewBuddyWorld, items: MenuItem[], name: string): MenuItem {
  return ensure(world)(
    items.find((item) => item.name.toLowerCase() === name.toLowerCase()),
    { label: `Menu item ${name} not found` }
  )
    .toBeDefined()
    .value as MenuItem;
}

function buildMenuPayload(
  name: string,
  fields: MenuFieldRow[]
): Partial<MenuItem> {
  const payload: Partial<MenuItem> = { name };
  for (const row of fields) {
    const field = String(row.field).toLowerCase();
    const value = row.value;
    if (field === "price") {
      payload.price = Number(value);
      continue;
    }
    if (field === "size") {
      payload.size = String(value);
      continue;
    }
    if (field === "description") {
      payload.description = String(value);
      continue;
    }
    if (field === "season") {
      const season = String(value);
      payload.season = season;
      payload.seasonal = season.trim().length > 0;
    }
  }
  payload.seasonal = payload.seasonal ?? true;
  payload.size = payload.size ?? "12oz";
  payload.price = payload.price ?? 6;
  return payload;
}

function parseMenuItem(world: BrewBuddyWorld): MenuItem {
  const body = ensure(world)(world.app.lastResponseBody as MenuItem | undefined, {
    label: "Menu creation response is missing",
  })
    .toBeDefined()
    .value as MenuItem;
  return {
    name: body?.name ?? "",
    price: body?.price ?? 0,
    size: body?.size ?? "",
    seasonal: body?.seasonal ?? false,
    description: body?.description ?? null,
    season: body?.season ?? null,
  } as MenuItem;
}

function ensureCloseTo(
  world: BrewBuddyWorld,
  actual: number,
  expected: number,
  precision: number,
  label: string
): void {
  ensure(world)(Number.isFinite(actual), {
    label: `${label} (actual)`
  }).toBeTruthy();
  ensure(world)(Number.isFinite(expected), {
    label: `${label} (expected)`
  }).toBeTruthy();
  const tolerance = Math.pow(10, -precision) / 2;
  const difference = Math.abs(actual - expected);
  ensure(world)(difference <= tolerance, { label }).toBeTruthy();
}
