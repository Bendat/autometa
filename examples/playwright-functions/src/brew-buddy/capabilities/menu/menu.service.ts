import type { TableValue } from "@autometa/core/gherkin";
import { WORLD_TOKEN } from "@autometa/core/runner";

import type { MenuItem } from "../../../../../.api/src/types/domain.js";
import type { BrewBuddyWorld } from "../../../world";
import { normalizeRegion, type MenuRegion } from "../../../utils/regions";
import type { CreateMenuItemInput } from "../../api/menu-client";

export interface MenuFieldInput {
  readonly field: string;
  readonly value: TableValue;
}

export interface MenuPriceUpdate {
  readonly name: string;
  readonly price: number;
}

/**
 * Menu capability: a small, scenario-scoped service used by steps.
 *
 * Goal: keep step definitions focused on intent, not HTTP plumbing.
 */
export class MenuService {
  // Injected lazily by the container (see composition root).
  // Using WORLD_TOKEN keeps this service independent from the app facade.
  readonly world!: BrewBuddyWorld;

  // The runner's container will populate this via property injection.
  // We keep it as a token reference so the intent is clear in the example.
  static readonly inject = { world: { token: WORLD_TOKEN, lazy: true } };

  async requestListing(region?: MenuRegion): Promise<MenuItem[]> {
    const query = region
      ? { region: normalizeRegion(region)?.toLowerCase() ?? region.toLowerCase() }
      : undefined;
    await this.world.app.history.track(this.world.app.menuClient.get(query));
    const items = this.extractFromLastResponse();
    this.world.app.memory.rememberMenuSnapshot(items);
    return items;
  }

  async requestListingForRegion(region: MenuRegion): Promise<MenuItem[]> {
    const normalized = normalizeRegion(region);
    if (!normalized) {
      throw new Error(`Invalid region: ${String(region)}`);
    }
    this.world.scenario.region = normalized;
    return await this.requestListing(normalized);
  }

  async createSeasonalDrink(name: string, fields: readonly MenuFieldInput[]): Promise<MenuItem> {
    const payload = this.buildMenuPayload(name, fields);
    await this.world.app.history.track(this.world.app.menuClient.create(payload));
    // The calling step typically asserts status via ensure.response.
    const created = this.parseLastMenuItem();
    this.world.app.memory.rememberLastMenuItem(created);
    this.world.scenario.createdItems.push(created.name);
    return created;
  }

  async retireDrink(name: string): Promise<void> {
    await this.world.app.history.track(this.world.app.menuClient.delete(name));
  }

  async applyBulkPriceUpdate(updates: readonly MenuPriceUpdate[]): Promise<MenuItem[]> {
    await this.world.app.history.track(this.world.app.menuClient.updatePrices(updates));
    const updated = this.extractFromLastResponse();
    this.world.app.memory.rememberMenuSnapshot(updated);
    return updated;
  }

  snapshot(): MenuItem[] {
    const existing = this.world.scenario.menuSnapshot;
    if (existing) {
      return existing;
    }

    const extracted = this.extractFromLastResponse();
    this.world.app.memory.rememberMenuSnapshot(extracted);
    return extracted;
  }

  rememberLast(item: MenuItem): void {
    this.world.app.memory.rememberLastMenuItem(item);
  }

  private extractFromLastResponse(): MenuItem[] {
    const body = this.world.app.history.lastResponseBody as
      | { items?: MenuItem[] }
      | MenuItem[]
      | undefined;

    if (Array.isArray(body)) {
      return body.map((item) => ({ ...item }));
    }

    const items = Array.isArray(body?.items) ? body.items ?? [] : [];
    return items.map((item) => ({ ...item }));
  }

  private parseLastMenuItem(): MenuItem {
    const body = this.world.app.history.lastResponseBody as MenuItem | undefined;
    if (!body || typeof body !== "object") {
      throw new Error("Menu creation response is missing");
    }
    return {
      name: (body as MenuItem).name ?? "",
      price: (body as MenuItem).price ?? 0,
      size: (body as MenuItem).size ?? "",
      seasonal: (body as MenuItem).seasonal ?? false,
      description: (body as MenuItem).description ?? null,
      season: (body as MenuItem).season ?? null,
    } as MenuItem;
  }

  private buildMenuPayload(
    name: string,
    fields: readonly MenuFieldInput[]
  ): CreateMenuItemInput {
    const payload: {
      name: string;
      price?: number;
      size?: string;
      description?: string;
      season?: string;
      seasonal?: boolean;
    } = { name };

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

    return payload as CreateMenuItemInput;
  }
}
