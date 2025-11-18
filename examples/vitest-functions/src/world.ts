import { HTTP, type HTTPResponse } from "@autometa/http";
import type { SimpleFeature } from "@autometa/gherkin";
import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
  Recipe,
} from "../../.api/src/types/domain.js";
import type { SseSession } from "./utils/sse.js";
import type { MenuRegion } from "./utils/regions";
import { BrewBuddyApp } from "./utils/http";

const DEFAULT_API_BASE_URL = "http://localhost:4000";

export interface BrewBuddyWorldBase {
  readonly baseUrl: string;
  readonly http: HTTP;
  lastResponse?: HTTPResponse<unknown>;
  lastResponseBody?: unknown;
  lastResponseHeaders?: Record<string, string>;
  lastError?: unknown;
  readonly aliases: {
    readonly tickets: Map<string, string>;
    readonly orders: Map<string, Order>;
    readonly recipes: Map<string, string>;
  };
  readonly scenario: ScenarioState;
  readonly features: SimpleFeature[];
}

export type BrewBuddyWorld = BrewBuddyWorldBase & { readonly app: BrewBuddyApp };

interface ScenarioState {
  menuSnapshot?: MenuItem[];
  lastMenuItem?: MenuItem;
  createdItems: string[];
  order?: Order;
  loyaltyAccount?: LoyaltyAccount;
  lastInventory?: InventoryItem;
  brewRatio?: string;
  tagRegistry?: TagRegistryEntry[];
  tagExpression?: string;
  selectedScenarioNames?: string[];
  stream?: SseSession;
  streamWarnings: string[];
  streamErrors: string[];
  region?: MenuRegion;
  priceUpdates?: Array<{ readonly name: string; readonly price: number }>;
}

export interface TagRegistryEntry {
  readonly tag: string;
  readonly description: string;
}

export function createWorld(): BrewBuddyWorldBase {
  const baseUrl = process.env.BREW_BUDDY_BASE_URL ?? DEFAULT_API_BASE_URL;
  const http = HTTP.create();

  const scenario: ScenarioState = {
    createdItems: [],
    streamWarnings: [],
    streamErrors: [],
  };

  return {
    baseUrl,
    http,
    aliases: {
      tickets: new Map(),
      orders: new Map(),
      recipes: new Map(),
    },
    scenario,
    features: [],
  };
}

export function disposeStream(world: BrewBuddyWorld): void {
  if (world.scenario.stream) {
    world.scenario.stream.close();
    delete world.scenario.stream;
  }
}

export function rememberMenuSnapshot(world: BrewBuddyWorld, items: MenuItem[]): void {
  world.scenario.menuSnapshot = items;
}

export function rememberLastMenuItem(world: BrewBuddyWorld, item: MenuItem): void {
  world.scenario.lastMenuItem = item;
}

export function rememberOrder(world: BrewBuddyWorld, order: Order): void {
  world.scenario.order = order;
  world.aliases.orders.set(order.ticket, order);
}

export function setTicketAlias(world: BrewBuddyWorld, alias: string, ticket: string): void {
  world.aliases.tickets.set(alias, ticket);
}

export function resolveTicket(world: BrewBuddyWorld, reference: string): string {
  return world.aliases.tickets.get(reference) ?? reference;
}

export function rememberLoyalty(world: BrewBuddyWorld, account: LoyaltyAccount): void {
  world.scenario.loyaltyAccount = account;
}

export function rememberInventory(world: BrewBuddyWorld, inventory: InventoryItem): void {
  world.scenario.lastInventory = inventory;
}

export function rememberRecipeSlug(world: BrewBuddyWorld, name: string, slug: string): void {
  world.aliases.recipes.set(name.toLowerCase(), slug);
}

export function resolveRecipeSlug(world: BrewBuddyWorld, name: string): string {
  return world.aliases.recipes.get(name.toLowerCase()) ?? name;
}

export function rememberRecipes(world: BrewBuddyWorld, recipes: Recipe[]): void {
  for (const recipe of recipes) {
    rememberRecipeSlug(world, recipe.name, recipe.slug);
  }
}

export function rememberBrewRatio(world: BrewBuddyWorld, ratio: string): void {
  world.scenario.brewRatio = ratio;
}

export function rememberTagRegistry(world: BrewBuddyWorld, entries: TagRegistryEntry[]): void {
  world.scenario.tagRegistry = entries;
}

export function rememberTagExpression(world: BrewBuddyWorld, expression: string, selected: string[]): void {
  world.scenario.tagExpression = expression;
  world.scenario.selectedScenarioNames = selected;
}

export function attachStream(world: BrewBuddyWorld, session: SseSession): void {
  disposeStream(world);
  world.scenario.stream = session;
}

export function currentStream(world: BrewBuddyWorld): SseSession | undefined {
  return world.scenario.stream;
}

export function recordStreamWarning(world: BrewBuddyWorld, message: string): void {
  world.scenario.streamWarnings.push(message);
}

export function recordStreamError(world: BrewBuddyWorld, message: string): void {
  world.scenario.streamErrors.push(message);
}

export function getScenarioWarnings(world: BrewBuddyWorld): readonly string[] {
  return world.scenario.streamWarnings;
}

export function getScenarioErrors(world: BrewBuddyWorld): readonly string[] {
  return world.scenario.streamErrors;
}
