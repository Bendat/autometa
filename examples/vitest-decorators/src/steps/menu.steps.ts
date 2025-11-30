import type { TableRecord, TableValue } from "@autometa/gherkin";
import {
  Binding,
  GivenDecorator as Given,
  WhenDecorator as When,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import type { BrewBuddyWorld } from "../world";
import { performRequest, type MenuRegion, normalizeRegion } from "../utils";
import type { MenuItem } from "../../../.api/src/types/domain.js";

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

@Binding()
export class MenuSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @When("I request the menu listing")
  async requestMenuListing(): Promise<void> {
    await performRequest(this.world, "get", "/menu");
    const items = this.extractMenuItems();
    this.world.app.memory.rememberMenuSnapshot(items);
  }

  @Then("the menu should include the default drinks")
  menuIncludesDefaultDrinks(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const expectations = table.asInstances(MenuExpectation);
    const items = this.ensureMenuItems();
    for (const expectation of expectations) {
      const item = this.findMenuItem(items, expectation.name);
      this.ensureCloseTo(item.price, expectation.price, 2, `Price mismatch for ${expectation.name}.`);
      ensure(item.size, { label: `Size mismatch for ${expectation.name}.` }).toStrictEqual(expectation.size);
    }
  }

  @Then("the menu should contain at least one item")
  menuContainsAtLeastOneItem(): void {
    const items = this.ensureMenuItems();
    ensure(items.length > 0, { label: "Menu should contain at least one item." }).toBeTruthy();
  }

  @Given("I create a seasonal drink named {string}")
  async createSeasonalDrink(name: string): Promise<void> {
    const fields = this.world.runtime.requireTable("horizontal").records<MenuFieldRow>();
    const payload = this.buildMenuPayload(name, fields);
    await performRequest(this.world, "post", "/menu", { body: payload });
    ensure.response.hasStatus(201);
    const created = this.parseMenuItem();
    this.world.app.memory.rememberLastMenuItem(created);
    this.world.scenario.createdItems.push(created.name);
  }

  @Then("the menu should include an item named {string} with price {float} and size {string}")
  menuIncludesItem(name: string, price: number, size: string): void {
    const items = this.ensureMenuItems();
    const item = this.findMenuItem(items, name);
    this.ensureCloseTo(item.price, price, 2, `Price mismatch for ${name}.`);
    ensure(item.size, { label: `Size mismatch for ${name}.` }).toStrictEqual(size);
    this.world.app.memory.rememberLastMenuItem(item);
  }

  @Then("the seasonal flag should be set to true")
  seasonalFlagSetToTrue(): void {
    const item = ensure(this.world.scenario.lastMenuItem, {
      label: "No menu item stored for assertion",
    }).toBeDefined().value as MenuItem;
    ensure(item.seasonal, { label: "Seasonal flag should be true." }).toStrictEqual(true);
  }

  @Given("a menu item named {string} exists for season {string}")
  async menuItemExistsForSeason(name: string, season: string): Promise<void> {
    const payload = {
      name,
      price: 6,
      size: "12oz",
      season,
      description: `${name} seasonal special`,
    } satisfies Partial<MenuItem> & { name: string; price: number; size: string; season: string };
    await performRequest(this.world, "post", "/menu", { body: payload });
    ensure.response.hasStatus(201);
  }

  @When("I retire the drink named {string}")
  async retireDrink(name: string): Promise<void> {
    await performRequest(this.world, "delete", `/menu/${encodeURIComponent(name)}`);
    ensure.response.hasStatus(204);
  }

  @Then("the menu should not include {string}")
  async menuShouldNotInclude(name: string): Promise<void> {
    await performRequest(this.world, "get", "/menu", { updateHistory: false });
    const items = this.extractMenuItems();
    ensure(
      items.some((item) => item.name.toLowerCase() === name.toLowerCase()),
      { label: `Menu should not include ${name}.` }
    ).toBeFalsy();
  }

  @Given("the following menu price changes are pending")
  menuPriceChangesPending(): void {
    const records = this.world.runtime.requireTable("horizontal").records<PriceUpdateRow>();
    this.world.scenario.priceUpdates = records.map((record) => ({
      name: String(record.name),
      price: Number(record.price),
    }));
  }

  @When("I apply the bulk price update")
  async applyBulkPriceUpdate(): Promise<void> {
    const updates = this.world.scenario.priceUpdates ?? [];
    await performRequest(this.world, "patch", "/menu/prices", { body: { updates } });
    ensure.response.hasStatus(200);
    const updated = this.extractMenuItems();
    this.world.app.memory.rememberMenuSnapshot(updated);
  }

  @Then("each price change should be reflected in the latest menu")
  priceChangesReflected(): void {
    const updates = this.world.scenario.priceUpdates ?? [];
    const items = this.ensureMenuItems();
    for (const update of updates) {
      const item = this.findMenuItem(items, update.name);
      this.ensureCloseTo(item.price, update.price, 2, `Price mismatch for ${update.name}.`);
    }
  }

  @Given("the seasonal schedule for {menuRegion} is configured")
  seasonalScheduleConfigured(region: MenuRegion): void {
    const normalized = normalizeRegion(region);
    if (!normalized) throw new Error(`Invalid region: ${region}`);
    this.world.scenario.region = normalized;
  }

  @When("I request the menu listing for {menuRegion}")
  async requestMenuForRegion(region: MenuRegion): Promise<void> {
    const normalized = normalizeRegion(region);
    if (!normalized) throw new Error(`Invalid region: ${region}`);
    this.world.scenario.region = normalized;
    await performRequest(this.world, "get", "/menu", { query: { region: normalized.toLowerCase() } });
    const items = this.extractMenuItems();
    this.world.app.memory.rememberMenuSnapshot(items);
  }

  @Then("the regional menu should include {menuSelection}")
  regionalMenuIncludesSelection(expectation: { beverage: string }): void {
    const snapshot = this.ensureMenuItems();
    const item = this.findMenuItem(snapshot, expectation.beverage);
    this.world.app.memory.rememberLastMenuItem(item);
  }

  @Then("the seasonal flag should reflect {menuSeasonal}")
  seasonalFlagReflects(expected: boolean): void {
    const resolved = ensure(this.world.scenario.lastMenuItem, {
      label: "No menu item stored for seasonal assertion",
    }).toBeDefined().value as MenuItem;
    ensure(resolved.seasonal, { label: "Seasonal flag mismatch." }).toStrictEqual(expected);
  }

  @Then("the menu snapshot should be available on the world context")
  menuSnapshotAvailable(): void {
    const snapshot = this.world.scenario.menuSnapshot ?? [];
    ensure(Array.isArray(snapshot), {
      label: "Menu snapshot should be stored as an array.",
    }).toBeTruthy();
  }

  @Then("the last tracked menu item should be {string}")
  lastTrackedMenuItem(name: string): void {
    ensure(this.world.scenario.lastMenuItem?.name, {
      label: "Scenario item mismatch on world context.",
    }).toStrictEqual(name);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private extractMenuItems(): MenuItem[] {
    const body = this.world.app.lastResponseBody as { items?: MenuItem[] } | MenuItem[] | undefined;
    if (Array.isArray(body)) {
      return body.map((item) => ({ ...item }));
    }
    const items = Array.isArray(body?.items) ? body?.items ?? [] : [];
    return items.map((item) => ({ ...item }));
  }

  private ensureMenuItems(): MenuItem[] {
    const snapshot = this.world.scenario.menuSnapshot;
    if (!snapshot) {
      const items = this.extractMenuItems();
      this.world.app.memory.rememberMenuSnapshot(items);
      return items;
    }
    return snapshot;
  }

  private findMenuItem(items: MenuItem[], name: string): MenuItem {
    return ensure(
      items.find((item) => item.name.toLowerCase() === name.toLowerCase()),
      { label: `Menu item ${name} not found` }
    ).toBeDefined().value as MenuItem;
  }

  private buildMenuPayload(name: string, fields: MenuFieldRow[]): Partial<MenuItem> {
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

  private parseMenuItem(): MenuItem {
    const body = ensure(this.world.app.lastResponseBody as MenuItem | undefined, {
      label: "Menu creation response is missing",
    }).toBeDefined().value as MenuItem;
    return {
      name: body?.name ?? "",
      price: body?.price ?? 0,
      size: body?.size ?? "",
      seasonal: body?.seasonal ?? false,
      description: body?.description ?? null,
      season: body?.season ?? null,
    } as MenuItem;
  }

  private ensureCloseTo(actual: number, expected: number, precision: number, label: string): void {
    ensure(Number.isFinite(actual), { label: `${label} (actual)` }).toBeTruthy();
    ensure(Number.isFinite(expected), { label: `${label} (expected)` }).toBeTruthy();
    const tolerance = Math.pow(10, -precision) / 2;
    const difference = Math.abs(actual - expected);
    ensure(difference <= tolerance, { label }).toBeTruthy();
  }
}
