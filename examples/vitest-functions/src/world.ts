import type { StepRuntimeHelpers } from "@autometa/executor";
import type { SimpleFeature } from "@autometa/gherkin";
import { WORLD_INHERIT_KEYS } from "@autometa/runner";
import type {
  InventoryItem,
  LoyaltyAccount,
  MenuItem,
  Order,
} from "../../.api/src/types/domain.js";
import type { MenuRegion } from "./utils/regions";
import { BrewBuddyClient } from "./utils/http";

const DEFAULT_API_BASE_URL = "http://localhost:4000";

export interface BrewBuddyWorldBase {
  baseUrl: string;
  readonly aliases: {
    readonly tickets: Map<string, string>;
    readonly orders: Map<string, Order>;
    readonly recipes: Map<string, string>;
  };
  readonly scenario: ScenarioState;
  readonly lifecycle: LifecycleMetrics;
  readonly features: SimpleFeature[];
  readonly runtime: StepRuntimeHelpers;
  readonly ancestors?: readonly BrewBuddyWorldBase[];
}

export type BrewBuddyWorld = BrewBuddyWorldBase & { readonly app: BrewBuddyClient };

export interface OrderErrorState {
  readonly status: number | undefined;
  readonly body: unknown;
}

interface ScenarioState {
  createdItems: string[];
  menuSnapshot?: MenuItem[];
  lastMenuItem?: MenuItem;
  order?: Order;
  expectOrderFailure?: boolean;
  lastOrderError: OrderErrorState | undefined;
  orders?: Map<string, { ticketId: string; status: string; events: unknown[] }>;
  loyaltyAccount?: LoyaltyAccount;
  lastInventory?: InventoryItem;
  brewRatio?: string;
  tagRegistry?: TagRegistryEntry[];
  tagExpression?: string;
  selectedScenarioNames?: string[];
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

export type StepLifecycleStatus = "passed" | "failed" | "skipped";

export interface LifecycleStepRecord {
  readonly scenario: string;
  readonly step: string;
  readonly status: StepLifecycleStatus;
}

export interface LifecycleMetrics {
  featureName?: string;
  beforeFeatureRuns: number;
  afterFeatureRuns: number;
  scenarioOrder: string[];
  stepHistory: LifecycleStepRecord[];
}

function defaultAliases(): BrewBuddyWorldBase["aliases"] {
  return {
    tickets: new Map(),
    orders: new Map(),
    recipes: new Map(),
  };
}

function createScenarioState(): ScenarioState {
  return {
    createdItems: [],
    streamWarnings: [],
    streamErrors: [],
    expectOrderFailure: false,
    lastOrderError: undefined,
  } satisfies ScenarioState;
}

function createLifecycleMetrics(): LifecycleMetrics {
  return {
    beforeFeatureRuns: 0,
    afterFeatureRuns: 0,
    scenarioOrder: [],
    stepHistory: [],
  } satisfies LifecycleMetrics;
}

const brewBuddyDefaults = {
  baseUrl: process.env.BREW_BUDDY_BASE_URL ?? DEFAULT_API_BASE_URL,
  aliases: defaultAliases(),
  scenario: createScenarioState(),
  lifecycle: createLifecycleMetrics(),
  features: [] as SimpleFeature[],
} satisfies Omit<BrewBuddyWorldBase, "runtime">;

export const brewBuddyWorldDefaults = brewBuddyDefaults as BrewBuddyWorldBase;

Object.defineProperty(brewBuddyWorldDefaults, WORLD_INHERIT_KEYS, {
  value: ["baseUrl", "aliases", "lifecycle"] satisfies readonly (keyof BrewBuddyWorldBase)[],
  writable: false,
  enumerable: false,
  configurable: true,
});
