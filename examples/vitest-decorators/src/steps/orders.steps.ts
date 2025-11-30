import {
  Binding,
  GivenDecorator as Given,
  WhenDecorator as When,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import { extractErrorStatus, performRequest } from "../utils";
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

@Binding()
export class OrderSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @When("I place an order for {string}")
  async placeOrder(drink: string): Promise<void> {
    const overrides = this.world.runtime.hasTable ? this.readOrderOverrides() : {};
    const itemOverrides = this.pickOrderItemOverrides(overrides);
    await this.submitOrder(drink, itemOverrides, { includeLoyalty: false });
  }

  @When("I place and pay for an order")
  async placeAndPayOrder(): Promise<void> {
    if (!this.world.runtime.hasTable) {
      throw new Error("Order details table is required when placing and paying for an order.");
    }

    const overrides = this.readOrderOverrides();
    const drink = this.resolveDrink(undefined, overrides);
    const itemOverrides = this.pickOrderItemOverrides(overrides);
    const payment = this.buildPaymentDetails(overrides);

    if (!payment?.method) {
      throw new Error("Payment method must be provided when placing and paying for an order.");
    }

    await this.submitOrder(drink, itemOverrides, {
      payment,
      includeLoyalty: true,
    });
  }

  @Then("the order response should include a preparation ticket")
  orderIncludesTicket(): void {
    if (this.world.scenario.lastOrderError) {
      throw new Error("Expected the most recent order request to succeed but an error was recorded.");
    }

    const order = this.parseOrder(this.world.app.lastResponseBody);
    if (!order.ticket || order.ticket.trim().length === 0) {
      throw new Error("Order response did not include a preparation ticket.");
    }

    this.recordOrder(order);
  }

  @Then("the order status should be {string}")
  async orderStatusIs(status: string): Promise<void> {
    const current = this.requireRecordedOrder();
    const order = await this.fetchOrder(current.ticket);
    if (order.status !== status) {
      throw new Error(`Expected order status to be "${status}" but was "${order.status}".`);
    }
  }

  @Then("the order should record the milk as {string}")
  async orderRecordsMilk(expected: string): Promise<void> {
    const order = await this.fetchOrder(this.requireRecordedOrder().ticket);
    const [item] = order.items;
    if (!item) {
      throw new Error("Order does not contain any items to verify milk preference.");
    }

    const actual = item.milk ?? "";
    if (String(actual).toLowerCase() !== expected.toLowerCase()) {
      throw new Error(`Expected milk preference to be "${expected}" but was "${actual ?? ""}".`);
    }
  }

  @Then("the order should record the sweetener as {string}")
  async orderRecordsSweetener(expected: string): Promise<void> {
    const order = await this.fetchOrder(this.requireRecordedOrder().ticket);
    const [item] = order.items;
    if (!item) {
      throw new Error("Order does not contain any items to verify sweetener preference.");
    }

    const actual = item.sweetener ?? "";
    if (String(actual).toLowerCase() !== expected.toLowerCase()) {
      throw new Error(`Expected sweetener preference to be "${expected}" but was "${actual ?? ""}".`);
    }
  }

  @Then("the loyalty account should earn 10 points")
  async loyaltyEarnsPoints(): Promise<void> {
    const loyalty = ensure(this.world.scenario.loyaltyAccount, {
      label: "No loyalty account is registered in the current scenario.",
    }).toBeDefined().value as LoyaltyAccount;
    const baseline = loyalty.points;

    await performRequest(this.world, "get", `/loyalty/${encodeURIComponent(loyalty.email)}`);
    ensure.response.hasStatus(200);

    const updated = this.parseLoyalty(this.world.app.lastResponseBody);
    if (updated.points !== baseline + 10) {
      throw new Error(`Expected loyalty account to have ${baseline + 10} points but found ${updated.points}.`);
    }

    this.world.app.memory.rememberLoyalty(updated);
  }

  @Then("the order should be rejected with status {int}")
  orderRejectedWithStatus(status: number): void {
    const error = this.requireOrderError();
    ensure.response.hasStatus(status);
    if (error.status !== status) {
      throw new Error(`Expected rejection status ${status} but received ${error.status ?? "unknown"}.`);
    }
  }

  @Then("the rejection reason should be {string}")
  rejectionReasonIs(reason: string): void {
    const error = this.requireOrderError();
    const body = (error.body ?? this.world.app.lastResponseBody) as Record<string, unknown> | undefined;
    if (!body || typeof body !== "object") {
      throw new Error("Order rejection reason is unavailable.");
    }

    const actualReason = String((body.reason ?? "")).trim();
    const actualCode = String((body.code ?? "")).trim();
    
    if (actualReason !== reason && actualCode !== reason) {
      throw new Error(`Expected rejection reason to be "${reason}" but found "${actualReason}" (code: "${actualCode}").`);
    }
  }

  @Given("a loyalty account exists for {string}")
  async loyaltyAccountExists(email: string): Promise<void> {
    await performRequest(this.world, "patch", `/loyalty/${encodeURIComponent(email)}`, {
      body: { points: 0 },
    });
    ensure.response.hasStatus(200);

    const account = this.parseLoyalty(this.world.app.lastResponseBody);
    this.world.app.memory.rememberLoyalty(account);
  }

  @Given("the inventory for {string} is set to {int} drinks")
  async setInventory(item: string, quantity: number): Promise<void> {
    await performRequest(this.world, "patch", `/inventory/${encodeURIComponent(item)}`, {
      body: { quantity },
    });
    ensure.response.hasStatus(200);

    const inventory = this.parseInventory(this.world.app.lastResponseBody);
    this.world.app.memory.rememberInventory(inventory);
    this.world.scenario.expectOrderFailure = quantity <= 0;
  }

  @Then("the inventory for {string} is restored to {int} drinks")
  async restoreInventory(item: string, quantity: number): Promise<void> {
    await performRequest(this.world, "patch", `/inventory/${encodeURIComponent(item)}`, {
      body: { quantity },
    });
    ensure.response.hasStatus(200);
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private readOrderOverrides(): Record<string, unknown> {
    const table = this.world.runtime.requireTable("vertical");
    const record = table.getRecord(0) as Record<string, unknown>;
    const normalised: Record<string, unknown> = {};

    for (const [rawKey, value] of Object.entries(record)) {
      const key = this.normaliseKey(rawKey);
      normalised[key] = normalizeValue(value);
    }

    return normalised;
  }

  private normaliseKey(key: string): string {
    return key.trim().toLowerCase().replace(/\s+/g, " ");
  }

  private pickOrderItemOverrides(source: Record<string, unknown>): Partial<Record<OrderItemField, unknown>> {
    const selected: Partial<Record<OrderItemField, unknown>> = {};
    for (const field of ORDER_ITEM_FIELDS) {
      if (field in source) {
        selected[field] = source[field];
      }
    }
    return selected;
  }

  private async submitOrder(
    drink: string,
    overrides: Partial<Record<OrderItemField, unknown>>,
    options: SubmitOrderOptions = {}
  ): Promise<void> {
    const item = this.buildOrderItem(drink, overrides);
    const payload: OrderInput = { items: [item] };

    if (options.payment) {
      payload.payment = options.payment;
    }

    if (options.includeLoyalty) {
      const loyaltyEmail = this.world.scenario.loyaltyAccount?.email;
      if (loyaltyEmail) {
        payload.loyaltyEmail = loyaltyEmail;
      }
    }

    this.world.scenario.lastOrderError = undefined;

    try {
      await performRequest(this.world, "post", "/orders", { body: payload });
      ensure.response.hasStatus(201);
    } catch (error) {
      const status = extractErrorStatus(this.world);
      this.world.scenario.lastOrderError = { status, body: this.world.app.lastResponseBody } satisfies OrderErrorState;
      if (!this.world.scenario.expectOrderFailure || status === undefined) {
        throw error;
      }
      this.world.scenario.expectOrderFailure = false;
      return;
    }

    const order = this.parseOrder(this.world.app.lastResponseBody);
    this.recordOrder(order);
    this.world.scenario.expectOrderFailure = false;
  }

  private buildOrderItem(drink: string, overrides: Partial<Record<OrderItemField, unknown>>): OrderItem {
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

  private buildPaymentDetails(overrides: Record<string, unknown>): PaymentDetails | undefined {
    const method = overrides.method;
    const amount = overrides.amount;
    const currency = overrides.currency;

    if (method === undefined && amount === undefined && currency === undefined) {
      return undefined;
    }

    const payment: PaymentDetails = {};

    if (method !== undefined && method !== null) {
      const candidate = this.normalizePaymentMethod(method);
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

  private normalizePaymentMethod(method: unknown): PaymentMethod | undefined {
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

  private resolveDrink(explicit: string | undefined, overrides: Record<string, unknown>): string {
    if (explicit && explicit.trim().length > 0) {
      return explicit;
    }

    const candidate = overrides.drink ?? overrides.item ?? overrides.name;
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }

    throw new Error("Order beverage name could not be determined.");
  }

  private parseOrder(payload: unknown): Order {
    if (this.isOrder(payload)) {
      return payload;
    }
    throw new Error("Expected the latest response body to contain an order payload.");
  }

  private isOrder(payload: unknown): payload is Order {
    if (!payload || typeof payload !== "object") {
      return false;
    }
    const candidate = payload as Partial<Order>;
    return typeof candidate.ticket === "string" && Array.isArray(candidate.items);
  }

  private recordOrder(order: Order): void {
    this.world.app.memory.rememberOrder(order);
    this.world.app.memory.setTicketAlias("latest", order.ticket);
  }

  private requireRecordedOrder(): Order {
    const order = this.world.scenario.order ?? (this.isOrder(this.world.app.lastResponseBody) ? (this.world.app.lastResponseBody as Order) : undefined);
    if (!order) {
      throw new Error("No order has been recorded for the current scenario.");
    }
    return order;
  }

  private async fetchOrder(ticket: string): Promise<Order> {
    await performRequest(this.world, "get", `/orders/${encodeURIComponent(ticket)}`);
    ensure.response.hasStatus(200);
    const order = this.parseOrder(this.world.app.lastResponseBody);
    this.recordOrder(order);
    return order;
  }

  private parseLoyalty(payload: unknown): LoyaltyAccount {
    if (payload && typeof payload === "object") {
      const { email, points } = payload as { email?: unknown; points?: unknown };
      if (typeof email === "string" && typeof points === "number") {
        return { email: email.toLowerCase(), points };
      }
    }
    throw new Error("Expected loyalty account details in the latest response body.");
  }

  private parseInventory(payload: unknown): InventoryItem {
    if (payload && typeof payload === "object") {
      const { item, quantity } = payload as { item?: unknown; quantity?: unknown };
      if (typeof item === "string" && typeof quantity === "number") {
        return { item, quantity };
      }
    }
    throw new Error("Expected inventory details in the latest response body.");
  }

  private requireOrderError(): OrderErrorState {
    const error = this.world.scenario.lastOrderError;
    if (!error) {
      throw new Error("No order error has been recorded for the current scenario.");
    }
    return error;
  }
}
