import { expect } from "vitest";

import type { RunnerStepsSurface } from "@autometa/runner";
import type { StepRuntimeHelpers } from "@autometa/executor";

import type { MenuItem } from "../../../.api/src/types/domain.js";
import { rememberLastMenuItem, rememberMenuSnapshot, type BrewBuddyWorld } from "../world";
import { performRequest } from "../utils/http";
import { assertStatus } from "../utils/assertions";
import { consumeHorizontalTable } from "../utils/tables";

const REGION_EXPECTATIONS: Record<string, { readonly expected: string; readonly seasonal: boolean }> = {
  East: { expected: "Golden Latte", seasonal: true },
  West: { expected: "Midnight Mocha", seasonal: true },
  North: { expected: "Flat White", seasonal: false },
  EU: { expected: "Citrus Cold Foam", seasonal: true },
  APAC: { expected: "Espresso", seasonal: false },
};

export function registerMenuSteps(environment: RunnerStepsSurface<BrewBuddyWorld>): void {
  environment.When("I request the menu listing", async (world: BrewBuddyWorld) => {
    await performRequest(world, "get", "/menu");
    const items = extractMenuItems(world);
    rememberMenuSnapshot(world, items);
  });

  environment.Then("the menu should include the default drinks", (world: BrewBuddyWorld, runtime: unknown) => {
    const rows = consumeHorizontalTable(runtime as StepRuntimeHelpers);
    const items = ensureMenuItems(world);
    for (const row of rows) {
      const name = requireColumn(row, "name");
      const price = Number(requireColumn(row, "price"));
      const size = requireColumn(row, "size");
      const item = findMenuItem(items, name);
      expect(item.price).toBeCloseTo(price);
      expect(item.size).toBe(size);
    }
  });

  environment.Given(/I create a seasonal drink named "([^"]+)"/, async (world: BrewBuddyWorld, name: unknown, runtime: unknown) => {
    const fields = consumeHorizontalTable(runtime as StepRuntimeHelpers);
    const payload = buildMenuPayload(String(name), fields);
    await performRequest(world, "post", "/menu", { body: payload });
    assertStatus(world, 201);
    const created = parseMenuItem(world);
    rememberLastMenuItem(world, created);
    world.scenario.createdItems.push(created.name);
  });

  environment.Then(
    /^the menu should include an item named "([^"]+)" with price ([\d.]+) and size "([^"]+)"$/,
    (world: BrewBuddyWorld, name: unknown, price: unknown, size: unknown) => {
      const items = ensureMenuItems(world);
      const item = findMenuItem(items, String(name));
      expect(item.price).toBeCloseTo(Number(price));
      expect(item.size).toBe(String(size));
      rememberLastMenuItem(world, item);
    }
  );

  environment.Then("the seasonal flag should be set to true", (world: BrewBuddyWorld) => {
    expect(world.scenario.lastMenuItem, "No menu item stored for assertion").toBeDefined();
    expect(world.scenario.lastMenuItem?.seasonal).toBe(true);
  });

  environment.Given(/a menu item named "([^"]+)" exists for season "([^"]+)"/, async (world: BrewBuddyWorld, name: unknown, season: unknown) => {
    const payload = {
      name: String(name),
      price: 6,
      size: "12oz",
      season: String(season),
      description: `${String(name)} seasonal special`,
    } satisfies Partial<MenuItem> & { name: string; price: number; size: string; season: string };
    await performRequest(world, "post", "/menu", { body: payload });
    assertStatus(world, 201);
  });

  environment.When(/I retire the drink named "([^"]+)"/, async (world: BrewBuddyWorld, name: unknown) => {
    await performRequest(world, "delete", `/menu/${encodeURIComponent(String(name))}`);
    assertStatus(world, 204);
  });

  environment.Then(/the menu should not include "([^"]+)"/, async (world: BrewBuddyWorld, name: unknown) => {
    await performRequest(world, "get", "/menu");
    const items = extractMenuItems(world);
    expect(items.some((item) => item.name.toLowerCase() === String(name).toLowerCase())).toBe(false);
  });

  environment.Given("the following menu price changes are pending", (world: BrewBuddyWorld, runtime: unknown) => {
    const rows = consumeHorizontalTable(runtime as StepRuntimeHelpers);
    world.scenario.priceUpdates = rows.map((row) => {
      const name = requireColumn(row, "name");
      const price = Number(requireColumn(row, "price"));
      return { name, price } as const;
    });
  });

  environment.When("I apply the bulk price update", async (world: BrewBuddyWorld) => {
    const updates = world.scenario.priceUpdates ?? [];
    await performRequest(world, "patch", "/menu/prices", { body: { updates } });
    assertStatus(world, 200);
    const updated = extractMenuItems(world);
    rememberMenuSnapshot(world, updated);
  });

  environment.Then("each price change should be reflected in the latest menu", (world: BrewBuddyWorld) => {
    const updates = world.scenario.priceUpdates ?? [];
    const items = ensureMenuItems(world);
    for (const update of updates) {
      const item = findMenuItem(items, update.name);
      expect(item.price).toBeCloseTo(update.price);
    }
  });

  environment.Given(/the seasonal schedule for "([^"]+)" is configured/, (world: BrewBuddyWorld, region: unknown) => {
    world.scenario.region = String(region);
  });

  environment.When(/I request the menu listing for "([^"]+)"/, async (world: BrewBuddyWorld, region: unknown) => {
    world.scenario.region = String(region);
    await performRequest(world, "get", "/menu");
    const items = extractMenuItems(world);
    rememberMenuSnapshot(world, items);
  });

  environment.Then(/the regional menu should include "([^"]+)"/, (world: BrewBuddyWorld, expected: unknown) => {
    const region = world.scenario.region ?? "";
    const expectation = REGION_EXPECTATIONS[region];
    if (!expectation) {
      throw new Error(`No regional expectations registered for ${region}`);
    }
    expect(String(expected)).toBe(expectation.expected);
    const items = ensureMenuItems(world);
    const item = findMenuItem(items, expectation.expected);
    rememberLastMenuItem(world, item);
  });

  environment.Then(/the seasonal flag should reflect "([^"]+)"/, (world: BrewBuddyWorld, expected: unknown) => {
    const item = world.scenario.lastMenuItem;
    expect(item, "No menu item stored for seasonal assertion").toBeDefined();
    expect(item?.seasonal).toBe(String(expected).toLowerCase() === "true");
  });
}

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
  const match = items.find((item) => item.name.toLowerCase() === name.toLowerCase());
  if (!match) {
    throw new Error(`Menu item ${name} not found`);
  }
  return match;
}

function buildMenuPayload(name: string, fields: Array<Record<string, string>>): Partial<MenuItem> {
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
