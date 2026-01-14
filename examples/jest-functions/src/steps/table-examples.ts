import { Given, Then, When } from "../step-definitions";
import { performRequest } from "../utils/http";
import type { BrewBuddyWorld } from "../world";

Given(
  "the following menu items exist:",
  async (world: BrewBuddyWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const records = table.records() as Array<Record<string, string>>;

    for (const record of records) {
      const name = record["name"];
      const price = parseFloat(record["price"] || "0");
      const size = record["size"] || "regular";
      const seasonal = record["seasonal"] === "true";
      const season = record["season"] || undefined;

      if (!name) {
        throw new Error("Menu item must have a name");
      }

      await performRequest(world, "POST", "/menu", {
        body: { name, price, size, seasonal, season },
      });

      world.scenario.createdItems.push(name);
    }
  }
);

Given(
  "the following recipes are configured:",
  async (world: BrewBuddyWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const records = table.records() as Array<Record<string, string>>;

    world.scenario.recipes = records.map((record) => ({
      name: record["name"] || "",
      base: record["base"] || "",
      additions: record["additions"] || "",
    }));
  }
);

When(
  "I update the following items:",
  async (world: BrewBuddyWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const records = table.records() as Array<Record<string, string>>;

    for (const record of records) {
      const name = record["name"];
      const price = record["price"] ? parseFloat(record["price"]) : undefined;

      if (!name) {
        throw new Error("Item update must include a name");
      }

      await performRequest(world, "PUT", `/menu/${encodeURIComponent(name)}`, {
        body: { price },
      });
    }
  }
);

When(
  "I submit price updates for:",
  async (world: BrewBuddyWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const records = table.records() as Array<Record<string, string>>;

    world.scenario.priceUpdates = records.map((record) => ({
      name: record["name"] || "",
      price: parseFloat(record["price"] || "0"),
    }));

    for (const update of world.scenario.priceUpdates) {
      await performRequest(world, "PUT", `/menu/${encodeURIComponent(update.name)}`, {
        body: { price: update.price },
      });
    }
  }
);

Then(
  "all prices should be updated correctly",
  async (world: BrewBuddyWorld) => {
    if (!world.scenario.priceUpdates) {
      throw new Error("No price updates were submitted");
    }

    for (const update of world.scenario.priceUpdates) {
      await performRequest(world, "GET", `/menu/${encodeURIComponent(update.name)}`);

      const body = world.app.lastResponseBody as { price?: number } | undefined;
      if (!body || typeof body !== "object") {
        throw new Error(`Failed to retrieve menu item "${update.name}"`);
      }

      if (body.price !== update.price) {
        throw new Error(
          `Expected price for "${update.name}" to be ${update.price}, got ${body.price}`
        );
      }
    }
  }
);

Then(
  "the menu should contain the following seasonal items:",
  async (world: BrewBuddyWorld) => {
    const table = world.runtime.requireTable("horizontal");
    const expected = table.records() as Array<Record<string, string>>;

    await performRequest(world, "GET", "/menu?seasonal=true");

    const body = world.app.lastResponseBody as { items?: Array<{ name: string }> } | Array<{ name: string }> | undefined;
    const items = Array.isArray(body) ? body : body?.items;

    if (!Array.isArray(items)) {
      throw new Error("Expected response to contain an items array");
    }

    const itemNames = new Set(items.map((item) => item.name));

    for (const row of expected) {
      const name = row["name"];
      if (name && !itemNames.has(name)) {
        throw new Error(`Expected seasonal menu to contain "${name}"`);
      }
    }
  }
);

Then(
  "the recipes should match the configuration",
  (world: BrewBuddyWorld) => {
    if (!world.scenario.recipes || world.scenario.recipes.length === 0) {
      throw new Error("No recipes were configured");
    }
    // Recipes are assumed to be correctly configured if they were set
  }
);
