import { Given, Then, When, ensure } from "../step-definitions";
import { extractErrorStatus, performRequest } from "../utils/http";
import { normalizeValue } from "../utils/json";
import type { BrewBuddyWorld, OrderErrorState } from "../world";
import type {
  InventoryItem,
  LoyaltyAccount,
  Order,
  OrderInput,
  OrderItem,
  PaymentDetails,
} from "../../../.api/src/types/domain.js";

const ORDER_ITEM_FIELDS = ["size", "shots", "milk", "sweetener"] as const;

const VALID_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set([
  "tap",
  "chip",
  "cash",
  "mobile",
]);

type OrderItemField = (typeof ORDER_ITEM_FIELDS)[number];

type PaymentMethod = Exclude<PaymentDetails["method"], undefined>;

interface SubmitOrderOptions {
  readonly payment?: PaymentDetails;
  readonly includeLoyalty?: boolean;
}

When("I place an order for {string}", async (drink: string, world: BrewBuddyWorld) => {
  const overrides = world.runtime.hasTable ? readOrderOverrides(world) : {};
  const itemOverrides = pickOrderItemOverrides(overrides);
  await submitOrder(world, drink, itemOverrides, { includeLoyalty: false });
});

When("I place and pay for an order", async (world: BrewBuddyWorld) => {
  if (!world.runtime.hasTable) {
    throw new Error("Order details table is required when placing and paying for an order.");
  }

  const overrides = readOrderOverrides(world);
  const drink = resolveDrink(undefined, overrides);
  const itemOverrides = pickOrderItemOverrides(overrides);
  const payment = buildPaymentDetails(overrides);

  if (!payment?.method) {
    throw new Error("Payment method must be provided when placing and paying for an order.");
  }

  await submitOrder(world, drink, itemOverrides, {
    payment,
    includeLoyalty: true,
  });
});

Then("the order response should include a preparation ticket", (world: BrewBuddyWorld) => {
  if (world.scenario.lastOrderError) {
    throw new Error("Expected the most recent order request to succeed but an error was recorded.");
  }

  const order = parseOrder(world.app.lastResponseBody);
  if (!order.ticket || order.ticket.trim().length === 0) {
    throw new Error("Order response did not include a preparation ticket.");
  }

  recordOrder(world, order);
});

Then("the order status should be {string}", async (status: string, world: BrewBuddyWorld) => {
  const current = requireRecordedOrder(world);
  const order = await fetchOrder(world, current.ticket);
  if (order.status !== status) {
    throw new Error(`Expected order status to be "${status}" but was "${order.status}".`);
  }
});

Then("the order should record the milk as {string}", async (expected: string, world: BrewBuddyWorld) => {
  const order = await fetchOrder(world, requireRecordedOrder(world).ticket);
  const [item] = order.items;
  if (!item) {
    throw new Error("Order does not contain any items to verify milk preference.");
  }

  const actual = item.milk ?? "";
  if (String(actual).toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`Expected milk preference to be "${expected}" but was "${actual ?? ""}".`);
  }
});

Then("the order should record the sweetener as {string}", async (expected: string, world: BrewBuddyWorld) => {
  const order = await fetchOrder(world, requireRecordedOrder(world).ticket);
  const [item] = order.items;
  if (!item) {
    throw new Error("Order does not contain any items to verify sweetener preference.");
  }

  const actual = item.sweetener ?? "";
  if (String(actual).toLowerCase() !== expected.toLowerCase()) {
    throw new Error(`Expected sweetener preference to be "${expected}" but was "${actual ?? ""}".`);
  }
});

Then("the loyalty account should earn 10 points", async (world: BrewBuddyWorld) => {
  const loyalty = ensure(world.scenario.loyaltyAccount, {
    label: "No loyalty account is registered in the current scenario.",
  })
    .toBeDefined()
    .value as LoyaltyAccount;
  const baseline = loyalty.points;

  await performRequest(world, "get", `/loyalty/${encodeURIComponent(loyalty.email)}`);
  ensure.response.hasStatus(200);

  const updated = parseLoyalty(world.app.lastResponseBody);
  if (updated.points !== baseline + 10) {
    throw new Error(`Expected loyalty account to have ${baseline + 10} points but found ${updated.points}.`);
  }

  world.app.memory.rememberLoyalty(updated);
});

Then("the order should be rejected with status {int}", (status: number, world: BrewBuddyWorld) => {
  const error = requireOrderError(world);
  ensure.response.hasStatus(status);
  if (error.status !== status) {
    throw new Error(`Expected rejection status ${status} but received ${error.status ?? "unknown"}.`);
  }
});

Then("the rejection reason should be {string}", (reason: string, world: BrewBuddyWorld) => {
  const error = requireOrderError(world);
  const body = (error.body ?? world.app.lastResponseBody) as Record<string, unknown> | undefined;
  if (!body || typeof body !== "object") {
    throw new Error("Order rejection reason is unavailable.");
  }

  const actualReason = String((body.reason ?? "")).trim();
  const actualCode = String((body.code ?? "")).trim();
  
  if (actualReason !== reason && actualCode !== reason) {
    throw new Error(`Expected rejection reason to be "${reason}" but found "${actualReason}" (code: "${actualCode}").`);
  }
});

Given("a loyalty account exists for {string}", async (email: string, world: BrewBuddyWorld) => {
  await performRequest(world, "patch", `/loyalty/${encodeURIComponent(email)}`, {
    body: { points: 0 },
  });
  ensure.response.hasStatus(200);

  const account = parseLoyalty(world.app.lastResponseBody);
  world.app.memory.rememberLoyalty(account);
});

Given("the inventory for {string} is set to {int} drinks", async (item: string, quantity: number, world: BrewBuddyWorld) => {
  await performRequest(world, "patch", `/inventory/${encodeURIComponent(item)}`, {
    body: { quantity },
  });
  ensure.response.hasStatus(200);

  const inventory = parseInventory(world.app.lastResponseBody);
  world.app.memory.rememberInventory(inventory);
  world.scenario.expectOrderFailure = quantity <= 0;
});

function readOrderOverrides(world: BrewBuddyWorld): Record<string, unknown> {
  const table = world.runtime.requireTable("vertical");
  const record = table.getRecord(0) as Record<string, unknown>;
  const normalised: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(record)) {
    const key = normaliseKey(rawKey);
    normalised[key] = normalizeValue(value);
  }

  return normalised;
}

function normaliseKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, " ");
}

function pickOrderItemOverrides(source: Record<string, unknown>): Partial<Record<OrderItemField, unknown>> {
  const selected: Partial<Record<OrderItemField, unknown>> = {};
  for (const field of ORDER_ITEM_FIELDS) {
    if (field in source) {
      selected[field] = source[field];
    }
  }
  return selected;
}

async function submitOrder(
  world: BrewBuddyWorld,
  drink: string,
  overrides: Partial<Record<OrderItemField, unknown>>,
  options: SubmitOrderOptions = {}
): Promise<void> {
  const item = buildOrderItem(drink, overrides);
  const payload: OrderInput = { items: [item] };

  if (options.payment) {
    payload.payment = options.payment;
  }

  if (options.includeLoyalty) {
    const loyaltyEmail = world.scenario.loyaltyAccount?.email;
    if (loyaltyEmail) {
      payload.loyaltyEmail = loyaltyEmail;
    }
  }

  world.scenario.lastOrderError = undefined;

  try {
    await performRequest(world, "post", "/orders", { body: payload });
    ensure.response.hasStatus(201);
  } catch (error) {
    const status = extractErrorStatus(world);
    world.scenario.lastOrderError = { status, body: world.app.lastResponseBody } satisfies OrderErrorState;
    if (!world.scenario.expectOrderFailure || status === undefined) {
      throw error;
    }
    world.scenario.expectOrderFailure = false;
    return;
  }

  const order = parseOrder(world.app.lastResponseBody);
  recordOrder(world, order);
  world.scenario.expectOrderFailure = false;
}

function buildOrderItem(drink: string, overrides: Partial<Record<OrderItemField, unknown>>): OrderItem {
  const item: OrderItem = { name: drink };

  const size = overrides.size;
  if (size !== undefined && size !== null && String(size).trim().length > 0) {
    item.size = String(size);
  }

  const shots = overrides.shots;
  if (shots !== undefined && shots !== null) {
    const numeric = typeof shots === "number" ? shots : Number(shots);
    if (Number.isFinite(numeric)) {
      item.shots = numeric;
    }
  }

  const milk = overrides.milk;
  if (milk !== undefined && milk !== null && String(milk).trim().length > 0) {
    item.milk = String(milk);
  }

  const sweetener = overrides.sweetener;
  if (sweetener !== undefined && sweetener !== null && String(sweetener).trim().length > 0) {
    item.sweetener = String(sweetener);
  }

  return item;
}

function buildPaymentDetails(overrides: Record<string, unknown>): PaymentDetails | undefined {
  const method = overrides.method;
  const amount = overrides.amount;
  const currency = overrides.currency;

  if (method === undefined && amount === undefined && currency === undefined) {
    return undefined;
  }

  const payment: PaymentDetails = {};

  if (method !== undefined && method !== null) {
    const candidate = normalizePaymentMethod(method);
    if (candidate) {
      payment.method = candidate;
    }
  }

  if (amount !== undefined && amount !== null) {
    const numeric = typeof amount === "number" ? amount : Number(amount);
    if (Number.isFinite(numeric)) {
      payment.amount = numeric;
    }
  }

  if (currency !== undefined && currency !== null) {
    payment.currency = String(currency);
  }

  return payment;
}

function normalizePaymentMethod(method: unknown): PaymentMethod | undefined {
  if (typeof method !== "string") {
    return undefined;
  }
  const normalised = method.trim().toLowerCase();
  if (!normalised.length) {
    return undefined;
  }
  if (VALID_PAYMENT_METHODS.has(normalised as PaymentMethod)) {
    return normalised as PaymentMethod;
  }
  return undefined;
}

function resolveDrink(explicit: string | undefined, overrides: Record<string, unknown>): string {
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }

  const candidate = overrides.drink ?? overrides.item ?? overrides.name;
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate;
  }

  throw new Error("Order beverage name could not be determined.");
}

function parseOrder(payload: unknown): Order {
  if (isOrder(payload)) {
    return payload;
  }
  throw new Error("Expected the latest response body to contain an order payload.");
}

function isOrder(payload: unknown): payload is Order {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Partial<Order>;
  return typeof candidate.ticket === "string" && Array.isArray(candidate.items);
}

function recordOrder(world: BrewBuddyWorld, order: Order): void {
  world.app.memory.rememberOrder(order);
  world.app.memory.setTicketAlias("latest", order.ticket);
}

function requireRecordedOrder(world: BrewBuddyWorld): Order {
  const order = world.scenario.order ?? (isOrder(world.app.lastResponseBody) ? (world.app.lastResponseBody as Order) : undefined);
  if (!order) {
    throw new Error("No order has been recorded for the current scenario.");
  }
  return order;
}

async function fetchOrder(world: BrewBuddyWorld, ticket: string): Promise<Order> {
  await performRequest(world, "get", `/orders/${encodeURIComponent(ticket)}`);
  ensure.response.hasStatus(200);
  const order = parseOrder(world.app.lastResponseBody);
  recordOrder(world, order);
  return order;
}

function parseLoyalty(payload: unknown): LoyaltyAccount {
  if (payload && typeof payload === "object") {
    const { email, points } = payload as { email?: unknown; points?: unknown };
    if (typeof email === "string" && typeof points === "number") {
      return { email: email.toLowerCase(), points };
    }
  }
  throw new Error("Expected loyalty account details in the latest response body.");
}

function parseInventory(payload: unknown): InventoryItem {
  if (payload && typeof payload === "object") {
    const { item, quantity } = payload as { item?: unknown; quantity?: unknown };
    if (typeof item === "string" && typeof quantity === "number") {
      return { item, quantity };
    }
  }
  throw new Error("Expected inventory details in the latest response body.");
}

function requireOrderError(world: BrewBuddyWorld): OrderErrorState {
  const error = world.scenario.lastOrderError;
  if (!error) {
    throw new Error("No order error has been recorded for the current scenario.");
  }
  return error;
}
