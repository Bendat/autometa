import { HTTP, type HTTPResponse } from "@autometa/http";
import type { StepRuntimeHelpers } from "@autometa/executor";
import type { SimpleFeature } from "@autometa/gherkin";
import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
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
  readonly runtime: StepRuntimeHelpers;
}

export type BrewBuddyWorld = BrewBuddyWorldBase & { readonly app: BrewBuddyApp };

interface ScenarioState {
  menuSnapshot?: MenuItem[];
  lastMenuItem?: MenuItem;
  createdItems: string[];
  order?: Order;
  orders?: Map<string, { ticketId: string; status: string; events: unknown[] }>;
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
  recipes?: Array<{ name: string; base: string; additions: string }>;
  tastingNotes?: Map<string, string>;
  brewRatios?: Map<string, string>;
  apiBaseUrl?: string;
  expectedStatusSequence?: string[];
  simulatedEvents?: Array<{ event: string; data: unknown }>;
  lastPickupCode?: string;
}

export interface TagRegistryEntry {
  readonly tag: string;
  readonly description: string;
}

const DEFAULT_SCENARIO_STATE: ScenarioState = {
  createdItems: [],
  streamWarnings: [],
  streamErrors: [],
};

export const brewBuddyWorldDefaults: Omit<BrewBuddyWorldBase, "runtime"> = {
  baseUrl: process.env.BREW_BUDDY_BASE_URL ?? DEFAULT_API_BASE_URL,
  http: HTTP.create(),
  aliases: {
    tickets: new Map(),
    orders: new Map(),
    recipes: new Map(),
  },
  scenario: DEFAULT_SCENARIO_STATE,
  features: [],
};

export function disposeStream(world: BrewBuddyWorld): void {
  if (world.scenario.stream) {
    world.scenario.stream.close();
    delete world.scenario.stream;
  }
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
