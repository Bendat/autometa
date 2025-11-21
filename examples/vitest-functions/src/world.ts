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
import type { WorldFactoryContext } from "@autometa/scopes";

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
  lifecycle: LifecycleMetrics;
}

export type BrewBuddyWorld = BrewBuddyWorldBase & { readonly app: BrewBuddyApp };

export interface OrderErrorState {
  readonly status: number | undefined;
  readonly body: unknown;
}

interface ScenarioState {
  menuSnapshot?: MenuItem[];
  lastMenuItem?: MenuItem;
  createdItems: string[];
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

function createScenarioState(): ScenarioState {
  return {
    createdItems: [],
    streamWarnings: [],
    streamErrors: [],
    expectOrderFailure: false,
    lastOrderError: undefined,
  } satisfies ScenarioState;
}

function createLifecycleMetrics(featureName?: string): LifecycleMetrics {
  const metrics: LifecycleMetrics = {
    beforeFeatureRuns: 0,
    afterFeatureRuns: 0,
    scenarioOrder: [],
    stepHistory: [],
  } satisfies LifecycleMetrics;

  if (featureName !== undefined) {
    metrics.featureName = featureName;
  }

  return metrics;
}

interface BaseWorldOverrides {
  baseUrl?: string;
  http?: HTTP;
  aliases?: BrewBuddyWorldBase["aliases"];
  features?: SimpleFeature[];
  lifecycle?: LifecycleMetrics;
  featureName?: string;
}

function defaultAliases(): BrewBuddyWorldBase["aliases"] {
  return {
    tickets: new Map(),
    orders: new Map(),
    recipes: new Map(),
  };
}

function createBaseWorld(overrides: BaseWorldOverrides = {}): BrewBuddyWorldBase {
  const world = {
    baseUrl: overrides.baseUrl ?? process.env.BREW_BUDDY_BASE_URL ?? DEFAULT_API_BASE_URL,
    http: overrides.http ?? HTTP.create(),
    aliases: overrides.aliases ?? defaultAliases(),
    scenario: createScenarioState(),
    features: overrides.features ?? [],
    lifecycle: overrides.lifecycle ?? createLifecycleMetrics(overrides.featureName),
  };

  return world as BrewBuddyWorldBase;
}

export function createBrewBuddyWorld(
  context: WorldFactoryContext<BrewBuddyWorldBase>
): BrewBuddyWorldBase {
  if (context.scope.kind === "feature") {
    return createBaseWorld({ featureName: context.scope.name });
  }

  const parentWorld = context.parent as BrewBuddyWorldBase | undefined;
  const overrides: BaseWorldOverrides = {};

  if (parentWorld) {
    overrides.baseUrl = parentWorld.baseUrl;
    overrides.http = parentWorld.http;
    overrides.features = parentWorld.features;
    overrides.lifecycle = parentWorld.lifecycle;
  }

  return createBaseWorld(overrides);
}

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
