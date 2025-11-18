import type { TableRecord, TableValue } from "@autometa/gherkin";

import { Given, Then, When } from "../step-definitions";
import type { MenuItem } from "../../../.api/src/types/domain.js";
import { type BrewBuddyWorld } from "../world";
import { performRequest } from "../utils/http";
import {
  assertCloseTo,
  assertDefined,
  assertFalse,
  assertStatus,
  assertStrictEqual,
  assertTrue,
} from "../utils/assertions";

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

Then("the menu should include the default drinks", function () {
  const table = this.runtime.requireTable("horizontal");
  const expectations = table.asInstances(MenuExpectation);
  const items = ensureMenuItems(this);
  for (const expectation of expectations) {
    const item = findMenuItem(items, expectation.name);
    assertCloseTo(item.price, expectation.price, 2, `Price mismatch for ${expectation.name}.`);
    assertStrictEqual(item.size, expectation.size, `Size mismatch for ${expectation.name}.`);
  }
});

Given("I create a seasonal drink named {string}", async function (name) {
  const fields = this.runtime
    .requireTable("horizontal")
    .records<MenuFieldRow>();
  const payload = buildMenuPayload(name, fields);
  await performRequest(this, "post", "/menu", { body: payload });
  assertStatus(this, 201);
  const created = parseMenuItem(this);
  this.app.memory.rememberLastMenuItem(created);
  this.scenario.createdItems.push(created.name);
});

Then(
  "the menu should include an item named {string} with price {float} and size {string}",
  (name, price, size, world) => {
    const items = ensureMenuItems(world);
    const item = findMenuItem(items, name);
    assertCloseTo(item.price, price, 2, `Price mismatch for ${name}.`);
    assertStrictEqual(item.size, size, `Size mismatch for ${name}.`);
    world.app.memory.rememberLastMenuItem(item);
  }
);

Then("the seasonal flag should be set to true", (world) => {
  const item = assertDefined(world.scenario.lastMenuItem, "No menu item stored for assertion");
  assertStrictEqual(item.seasonal, true, "Seasonal flag should be true.");
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
    assertStatus(world, 201);
  }
);

When("I retire the drink named {string}", async (name, world) => {
  await performRequest(world, "delete", `/menu/${encodeURIComponent(name)}`);
  assertStatus(world, 204);
});

Then("the menu should not include {string}", async (name, world) => {
  await performRequest(world, "get", "/menu");
  const items = extractMenuItems(world);
  assertFalse(
    items.some((item) => item.name.toLowerCase() === name.toLowerCase()),
    `Menu should not include ${name}.`
  );
});

Given("the following menu price changes are pending", function () {
  const records = this.runtime
    .requireTable("horizontal")
    .records<PriceUpdateRow>();
  this.scenario.priceUpdates = records.map((record) => ({
    name: String(record.name),
    price: Number(record.price),
  }));
});

When("I apply the bulk price update", async (world) => {
  const updates = world.scenario.priceUpdates ?? [];
  await performRequest(world, "patch", "/menu/prices", { body: { updates } });
  assertStatus(world, 200);
  const updated = extractMenuItems(world);
  world.app.memory.rememberMenuSnapshot(updated);
});

Then("each price change should be reflected in the latest menu", (world) => {
  const updates = world.scenario.priceUpdates ?? [];
  const items = ensureMenuItems(world);
  for (const update of updates) {
    const item = findMenuItem(items, update.name);
    assertCloseTo(item.price, update.price, 2, `Price mismatch for ${update.name}.`);
  }
});

Given(
  'the seasonal schedule for "{menuRegion}" is configured',
  (region, world) => {
    world.scenario.region = region;
  }
);

When('I request the menu listing for "{menuRegion}"', async (region, world) => {
  world.scenario.region = region;
  await performRequest(world, "get", "/menu");
  const items = extractMenuItems(world);
  world.app.memory.rememberMenuSnapshot(items);
});

Then(
  'the regional menu should include "{menuSelection}"',
  (expectation, world) => {
    const snapshot = ensureMenuItems(world);
    const item = findMenuItem(snapshot, expectation.beverage);
    world.app.memory.rememberLastMenuItem(item);
  }
);

Then('the seasonal flag should reflect "{menuSeasonal}"', (expected, world) => {
  const item = world.scenario.lastMenuItem;
  const resolved = assertDefined(item, "No menu item stored for seasonal assertion");
  assertStrictEqual(resolved.seasonal, expected, "Seasonal flag mismatch.");
});

Then(
  "the menu snapshot should be available on the world context",
  function (world) {
    assertStrictEqual(this, world, "Step context should match world instance.");
    const snapshot = this.scenario.menuSnapshot ?? [];
    assertTrue(Array.isArray(snapshot), "Menu snapshot should be stored as an array.");
  }
);

Then(
  "the last tracked menu item should be {string} when accessed via this",
  function (name, world) {
    assertStrictEqual(this.scenario.lastMenuItem?.name, name, "Scenario item mismatch on step context.");
    assertStrictEqual(world.scenario.lastMenuItem?.name, name, "Scenario item mismatch on world context.");
  }
);

function extractMenuItems(world: BrewBuddyWorld): MenuItem[] {
  const body = world.lastResponseBody as { items?: MenuItem[] } | undefined;
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

function findMenuItem(items: MenuItem[], name: string): MenuItem {
  const match = items.find(
    (item) => item.name.toLowerCase() === name.toLowerCase()
  );
  if (!match) {
    throw new Error(`Menu item ${name} not found`);
  }
  return match;
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
  const body = assertDefined(world.lastResponseBody as MenuItem | undefined, "Menu creation response is missing");
  return {
    name: body?.name ?? "",
    price: body?.price ?? 0,
    size: body?.size ?? "",
    seasonal: body?.seasonal ?? false,
    description: body?.description ?? null,
    season: body?.season ?? null,
  } as MenuItem;
}
