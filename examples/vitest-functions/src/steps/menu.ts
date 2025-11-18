import { expect } from "vitest";

import { createStepRuntime } from "@autometa/executor";

import { Given, Then, When } from "../step-definitions";
import type { MenuItem } from "../../../.api/src/types/domain.js";
import {
  rememberLastMenuItem,
  rememberMenuSnapshot,
  type BrewBuddyWorld,
} from "../world";
import { performRequest } from "../utils/http";
import { assertStatus } from "../utils/assertions";
import { consumeHorizontalTable } from "../utils/tables";

When("I request the menu listing", async (world) => {
  await performRequest(world, "get", "/menu");
  const items = extractMenuItems(world);
  rememberMenuSnapshot(world, items);
});

Then(
  "the menu should include the default drinks",
  function () {
    const runtime = createStepRuntime(this);
    const rows = consumeHorizontalTable(runtime);
    const items = ensureMenuItems(this);
    for (const row of rows) {
      const name = requireColumn(row, "name");
      const price = Number(requireColumn(row, "price"));
      const size = requireColumn(row, "size");
      const item = findMenuItem(items, name);
      expect(item.price).toBeCloseTo(price);
      expect(item.size).toBe(size);
    }
  }
);

Given(
  "I create a seasonal drink named {string}",
  async function (name) {
    const runtime = createStepRuntime(this);
    const fields = consumeHorizontalTable(runtime);
    const payload = buildMenuPayload(name, fields);
    await performRequest(this, "post", "/menu", { body: payload });
    assertStatus(this, 201);
    const created = parseMenuItem(this);
    rememberLastMenuItem(this, created);
    this.scenario.createdItems.push(created.name);
  }
);

Then(
  "the menu should include an item named {string} with price {float} and size {string}",
  (name, price, size, world) => {
    const items = ensureMenuItems(world);
    const item = findMenuItem(items, name);
    expect(item.price).toBeCloseTo(price);
    expect(item.size).toBe(size);
    rememberLastMenuItem(world, item);
  }
);

Then("the seasonal flag should be set to true", (world) => {
  expect(
    world.scenario.lastMenuItem,
    "No menu item stored for assertion"
  ).toBeDefined();
  expect(world.scenario.lastMenuItem?.seasonal).toBe(true);
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

Then(
  "the menu should not include {string}",
  async (name, world) => {
    await performRequest(world, "get", "/menu");
    const items = extractMenuItems(world);
    expect(
      items.some((item) => item.name.toLowerCase() === name.toLowerCase())
    ).toBe(false);
  }
);

Given(
  "the following menu price changes are pending",
  function () {
    const runtime = createStepRuntime(this);
    const rows = consumeHorizontalTable(runtime);
    this.scenario.priceUpdates = rows.map((row) => {
      const name = requireColumn(row, "name");
      const price = Number(requireColumn(row, "price"));
      return { name, price } as const;
    });
  }
);

When("I apply the bulk price update", async (world) => {
  const updates = world.scenario.priceUpdates ?? [];
  await performRequest(world, "patch", "/menu/prices", { body: { updates } });
  assertStatus(world, 200);
  const updated = extractMenuItems(world);
  rememberMenuSnapshot(world, updated);
});

Then(
  "each price change should be reflected in the latest menu",
  (world) => {
    const updates = world.scenario.priceUpdates ?? [];
    const items = ensureMenuItems(world);
    for (const update of updates) {
      const item = findMenuItem(items, update.name);
      expect(item.price).toBeCloseTo(update.price);
    }
  }
);

Given(
  'the seasonal schedule for "{menuRegion}" is configured',
  (region, world) => {
    world.scenario.region = region;
  }
);

When(
  'I request the menu listing for "{menuRegion}"',
  async (region, world) => {
    world.scenario.region = region;
    await performRequest(world, "get", "/menu");
    const items = extractMenuItems(world);
    rememberMenuSnapshot(world, items);
  }
);

Then(
  'the regional menu should include "{menuSelection}"',
  (expectation, world) => {
    const snapshot = ensureMenuItems(world);
    const item = findMenuItem(snapshot, expectation.beverage);
    rememberLastMenuItem(world, item);
  }
);

Then(
  'the seasonal flag should reflect "{menuSeasonal}"',
  (expected, world) => {
    const item = world.scenario.lastMenuItem;
    expect(item, "No menu item stored for seasonal assertion").toBeDefined();
    expect(item?.seasonal).toBe(expected);
  }
);

Then(
  "the menu snapshot should be available on the world context",
  function (world) {
    expect(this).toBe(world);
    const snapshot = this.scenario.menuSnapshot ?? [];
    expect(Array.isArray(snapshot)).toBe(true);
  }
);

Then(
  "the last tracked menu item should be {string} when accessed via this",
  function (name, world) {
    expect(this.scenario.lastMenuItem?.name).toBe(name);
    expect(world.scenario.lastMenuItem?.name).toBe(name);
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
    rememberMenuSnapshot(world, items);
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
  fields: Array<Record<string, string>>
): Partial<MenuItem> {
  const payload: Partial<MenuItem> = { name };
  for (const row of fields) {
    const field = requireColumn(row, "field").toLowerCase();
    const value = requireColumn(row, "value");
    if (field === "price") {
      payload.price = Number(value);
      continue;
    }
    if (field === "size") {
      payload.size = value;
      continue;
    }
    if (field === "description") {
      payload.description = value;
      continue;
    }
    if (field === "season") {
      payload.season = value;
      payload.seasonal = value.trim().length > 0;
    }
  }
  payload.seasonal = payload.seasonal ?? true;
  payload.size = payload.size ?? "12oz";
  payload.price = payload.price ?? 6;
  return payload;
}

function parseMenuItem(world: BrewBuddyWorld): MenuItem {
  const body = world.lastResponseBody as MenuItem | undefined;
  expect(body, "Menu creation response is missing").toBeDefined();
  return {
    name: body?.name ?? "",
    price: body?.price ?? 0,
    size: body?.size ?? "",
    seasonal: body?.seasonal ?? false,
    description: body?.description ?? null,
    season: body?.season ?? null,
  } as MenuItem;
}

function requireColumn(row: Record<string, string>, column: string): string {
  const value = row[column];
  if (value === undefined || value === "") {
    throw new Error(`Table row is missing required column "${column}"`);
  }
  return value;
}
