import { HTTP, HTTPError, type HTTPResponse } from "@autometa/http";

import type { BrewBuddyWorld, BrewBuddyWorldBase } from "../../world";
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

  lastResponse?: HTTPResponse<unknown>;
  lastResponseBody?: unknown;
  lastResponseHeaders?: Record<string, string>;
  lastError?: unknown;

  constructor(http: HTTP, memory: BrewBuddyMemoryService) {
    this.http = http
      .sharedHeader("accept", "application/json")
      .sharedAllowPlainText(true);
    this.memory = memory;

    // Initialize domain clients with shared HTTP instance
    this.menuClient = new MenuClient(this.http);
    this.recipes = new RecipeClient(this.http);
    this.orders = new OrderClient(this.http);
    this.loyalty = new LoyaltyClient(this.http);
    this.inventory = new InventoryClient(this.http);
    this.admin = new AdminClient(this.http);
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

  /**
   * Execute an HTTP request and record response history.
   * Used by domain clients to update lastResponse/lastResponseBody/lastError.
   */
  async withHistory<T>(request: Promise<HTTPResponse<T>>): Promise<HTTPResponse<T>> {
    try {
      const response = await request;
      this.lastResponse = response;
      this.lastResponseBody = response.data;
      this.lastResponseHeaders = normalizeHeaders(response.headers ?? {});
      delete this.lastError;

      if (response.status >= 400) {
        const error = new HTTPError(
          `Request failed with status ${response.status}`,
          response.request,
          response
        );
        throw error;
      }

      return response;
    } catch (error) {
      this.lastError = error;

      // Preserve error responses for downstream assertions.
      // This mirrors extractErrorStatus(), but keeps the full history hydrated.
      if (error instanceof HTTPError && error.response) {
        this.lastResponse = error.response;
        this.lastResponseBody = error.response.data;
        this.lastResponseHeaders = normalizeHeaders(error.response.headers ?? {});
        throw error;
      }

      delete this.lastResponse;
      delete this.lastResponseBody;
      delete this.lastResponseHeaders;
      throw error;
    }
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

  async perform(method: HttpMethodInput, path: string, options: RequestOptions = {}) {
    try {
      const response = await this.request(method, path, options);
      if (options.updateHistory !== false) {
        this.lastResponse = response;
        this.lastResponseBody = response.data;
        this.lastResponseHeaders = normalizeHeaders(response.headers ?? {});
        delete this.lastError;
      }
      if (response.status >= 400) {
        const error = new HTTPError(
          `Request failed with status ${response.status}`,
          response.request,
          response
        );
        throw error;
      }
    } catch (error) {
      if (options.updateHistory !== false) {
        delete this.lastResponse;
        delete this.lastResponseBody;
        delete this.lastResponseHeaders;
        this.lastError = error;
      }
      throw error;
    }
  }

  extractErrorStatus(): number | undefined {
    const error = this.lastError;
    if (error instanceof HTTPError && error.response) {
      const status = error.response.status;
      this.lastResponse = error.response;
      this.lastResponseBody = error.response.data;
      this.lastResponseHeaders = normalizeHeaders(error.response.headers ?? {});
      return status;
    }
    return undefined;
  }
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

function normalizeHeaders(headers: Record<string, string>): Record<string, string> {
  const normalised: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    normalised[key.toLowerCase()] = String(value);
  }
  return normalised;
}
