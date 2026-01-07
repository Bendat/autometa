import { HTTP } from "@autometa/http";

import type { BrewBuddyWorldBase } from "../../world";
import { BrewBuddyStreamManager } from "../services/stream-manager";
import { TagRegistryService } from "../services/tag-registry.service";
import { BrewBuddyMemoryService } from "../state/memory.service";
import type { MenuService } from "../capabilities/menu/menu.service";
import { MenuClient } from "./menu-client";
import { RecipeClient } from "./recipe-client";
import { OrderClient } from "./order-client";
import { LoyaltyClient } from "./loyalty-client";
import { InventoryClient } from "./inventory-client";
import { AdminClient } from "./admin-client";
import { HttpHistoryService } from "../http/http-history.service";
import { RecipeArrangerService } from "../recipes/recipe-arranger.service";

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE" | "PUT";
export type HttpMethodInput = HttpMethod | Lowercase<HttpMethod>;

export interface RequestOptions {
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly query?: Record<string, unknown>;
  readonly updateHistory?: boolean;
}

/**
 * Brew Buddy API facade.
 *
 * Composes domain HTTP clients and manages shared response state.
 */
export class BrewBuddyClient {
  readonly http: HTTP;
  readonly memory: BrewBuddyMemoryService;
  readonly history: HttpHistoryService;
  private _streamManager?: BrewBuddyStreamManager;
  private _tags?: TagRegistryService;
  private _menu?: MenuService;
  private _world?: BrewBuddyWorldBase;

  // Domain HTTP clients
  readonly menuClient: MenuClient;
  readonly recipes: RecipeClient;
  readonly orders: OrderClient;
  readonly loyalty: LoyaltyClient;
  readonly inventory: InventoryClient;
  readonly admin: AdminClient;

  // Orchestrations (keep app methods reserved for these)
  readonly arrangeRecipes: RecipeArrangerService;

  constructor(
    http: HTTP,
    memory: BrewBuddyMemoryService,
    history: HttpHistoryService,
    menuClient: MenuClient,
    recipes: RecipeClient,
    orders: OrderClient,
    loyalty: LoyaltyClient,
    inventory: InventoryClient,
    admin: AdminClient,
    arrangeRecipes: RecipeArrangerService
  ) {
    this.http = http
      .sharedHeader("accept", "application/json")
      .sharedAllowPlainText(true);
    this.memory = memory;
    this.history = history;

    this.menuClient = menuClient;
    this.recipes = recipes;
    this.orders = orders;
    this.loyalty = loyalty;
    this.inventory = inventory;
    this.admin = admin;
    this.arrangeRecipes = arrangeRecipes;
  }

  set world(world: BrewBuddyWorldBase) {
    this._world = world;
    this.http.url(world.baseUrl);
  }

  get world(): BrewBuddyWorldBase {
    if (!this._world) {
      throw new Error("BrewBuddy app world is not set");
    }
    return this._world;
  }

  set streamManager(streamManager: BrewBuddyStreamManager) {
    this._streamManager = streamManager;
  }

  get streamManager(): BrewBuddyStreamManager {
    if (!this._streamManager) {
      throw new Error("BrewBuddy stream manager has not been configured");
    }
    return this._streamManager;
  }

  set tags(tags: TagRegistryService) {
    this._tags = tags;
  }

  get tags(): TagRegistryService {
    if (!this._tags) {
      throw new Error("Tag registry service has not been configured");
    }
    return this._tags;
  }

  set menu(menu: MenuService) {
    this._menu = menu;
  }

  get menu(): MenuService {
    if (!this._menu) {
      throw new Error("Menu service has not been configured");
    }
    return this._menu;
  }

  request(method: HttpMethodInput, path: string, options: RequestOptions = {}) {
    const segments = normalisePath(path);
    const client = this.http
      .route(...segments)
      .headers(options.headers ?? {})
      .params(options.query ?? {})
      .data(options.body);

    return dispatch(client, method);
  }

  // Intentionally no `perform()` / `withHistory()` here anymore.
  // Use `world.app.history.track(world.app.client.action())`.
}

async function dispatch(client: HTTP, method: HttpMethodInput) {
  switch (method.toLowerCase()) {
    case "get":
      return client.get();
    case "post":
      return client.post();
    case "put":
      return client.put();
    case "patch":
      return client.patch();
    case "delete":
      return client.delete();
    default:
      throw new Error(`Unsupported HTTP method: ${method}`);
  }
}

function normalisePath(path: string): string[] {
  const trimmed = path.trim();
  if (!trimmed) {
    return [];
  }
  const url = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return url.split("/").filter(Boolean);
}

