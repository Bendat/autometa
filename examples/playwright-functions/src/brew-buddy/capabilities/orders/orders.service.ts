import { HTTPError } from "@autometa/http";
import { createEnsureFactory, ensure } from "@autometa/assertions";

import type { BrewBuddyWorldBase } from "../../../world";
import type { Order, OrderInput } from "../../../../../.api/src/types/domain.js";

import { HttpHistoryService } from "../../http/http-history.service";
import { BrewBuddyMemoryService } from "../../state/memory.service";
import { OrderClient } from "../../domain/clients/order-client";

import {
  buildOrderItem,
  buildPaymentDetails,
  resolveDrink,
} from "./order-builders";
import { pickOrderItemOverrides, readOrderOverrides } from "./order-overrides";
import { parseOrder } from "./order-parsers";
import { orderAssertionsPlugin } from "../../domain/ensure/order.plugin";

const orderEnsurePlugins = {
  order: orderAssertionsPlugin<BrewBuddyWorldBase>(),
} as const;

export interface PlaceOrderResult {
  readonly order?: Order;
  readonly errorStatus?: number;
}

export class OrdersService {
  private static readonly ensureFactory = createEnsureFactory<
    BrewBuddyWorldBase,
    typeof orderEnsurePlugins
  >(ensure, orderEnsurePlugins);

  // World reference is injected lazily via the test container.
  private world!: BrewBuddyWorldBase;

  constructor(
    private readonly history: HttpHistoryService,
    private readonly memory: BrewBuddyMemoryService,
    private readonly orders: OrderClient
  ) {}

  placeOrderForDrink(drink: string): Promise<void> {
    const world = this.requireWorld();

    const table = world.runtime.consumeTable("vertical");
    const overrides = table ? readOrderOverrides(table) : {};

    const itemOverrides = pickOrderItemOverrides(overrides);

    return this.submitOrder({
      drink,
      itemOverrides,
      includeLoyalty: false,
    });
  }

  placeAndPayFromTable(): Promise<void> {
    const world = this.requireWorld();

    const overrides = readOrderOverrides(world.runtime.requireTable("vertical"));
    const drink = resolveDrink(undefined, overrides);
    const itemOverrides = pickOrderItemOverrides(overrides);
    const payment = buildPaymentDetails(overrides);

    ensure(payment?.method, {
      label: "Payment method must be provided when placing and paying for an order.",
    }).toBeDefined();

    return this.submitOrder({
      drink,
      itemOverrides,
      includeLoyalty: true,
      payment,
    });
  }

  rememberTicketFromLastResponse(): void {
    const world = this.requireWorld();

    ensure(world.scenario.lastOrderError, {
      label: "Expected the most recent order request to succeed but an error was recorded.",
    }).toBeUndefined();

    const order = parseOrder(this.history.lastResponseBody);

    const ticket = ensure(order.ticket, {
      label: "Order response did not include a preparation ticket.",
    })
      .toBeDefined()
      .value;
    ensure(ticket.trim().length, {
      label: "Order response did not include a preparation ticket.",
    }).toBeGreaterThan(0);

    this.recordOrder({ ...order, ticket: ticket.trim() });
  }

  async assertOrderStatus(expectedStatus: string): Promise<void> {
    const order = await this.fetchOrder(this.requireRecordedOrder().ticket);
    // Status assertions can be expressed directly via base `ensure(...)` without
    // a dedicated domain facet.
    ensure(order.status, { label: "order status" }).toStrictEqual(expectedStatus);
  }

  async assertMilk(expected: string): Promise<void> {
    await this.fetchOrder(this.requireRecordedOrder().ticket);
    this.ensure().order.milkIs(expected);
  }

  async assertSweetener(expected: string): Promise<void> {
    await this.fetchOrder(this.requireRecordedOrder().ticket);
    this.ensure().order.sweetenerIs(expected);
  }

  recordExpectedOrderFailure(): void {
    const world = this.requireWorld();
    world.scenario.expectOrderFailure = true;
  }

  requireLastOrderError(): { status: number | undefined; body: unknown } {
    const world = this.requireWorld();
    return ensure(world.scenario.lastOrderError, {
      label: "No order error has been recorded for the current scenario.",
    })
      .toBeDefined()
      .value;
  }

  assertRejectedStatus(expected: number): void {
    const error = this.requireLastOrderError();
    ensure(error.status, {
      label: `Expected rejection status ${expected} but received ${error.status ?? "unknown"}.`,
    }).toStrictEqual(expected);
  }

  assertRejectedReason(expected: string): void {
    const error = this.requireLastOrderError();
    const body = ensure(error.body, {
      label: "Order rejection reason is unavailable.",
    }).toBeDefined().value;

    ensure(body !== null && typeof body === "object", {
      label: "Order rejection reason is unavailable.",
    }).toBeTruthy();

    const dict = body as Record<string, unknown>;
    const actualReason = String(dict.reason ?? "").trim();
    const actualCode = String(dict.code ?? "").trim();

    ensure(actualReason === expected || actualCode === expected, {
      label: `Expected rejection reason to be "${expected}" but found "${actualReason}" (code: "${actualCode}").`,
    }).toBeTruthy();
  }

  private async submitOrder(args: {
    readonly drink: string;
    readonly itemOverrides: Record<string, unknown>;
    readonly includeLoyalty: boolean;
    readonly payment?: OrderInput["payment"];
  }): Promise<void> {
    const world = this.requireWorld();

    const item = buildOrderItem(args.drink, args.itemOverrides);
    const payload: OrderInput = { items: [item] };

    if (args.payment) {
      payload.payment = args.payment;
    }

    if (args.includeLoyalty) {
      const loyaltyEmail = world.scenario.loyaltyAccount?.email;
      if (loyaltyEmail) {
        payload.loyaltyEmail = loyaltyEmail;
      }
    }

    world.scenario.lastOrderError = undefined;

    try {
      await this.history.track(this.orders.create(payload));
      ensure(this.history.lastResponse?.status, {
        label: `Expected order creation to return 201 but was ${this.history.lastResponse?.status ?? "unknown"}.`,
      }).toStrictEqual(201);
    } catch (error) {
      const status =
        error instanceof HTTPError ? error.response?.status : undefined;
      world.scenario.lastOrderError = {
        status,
        body: this.history.lastResponseBody,
      };

      if (!world.scenario.expectOrderFailure || status === undefined) {
        throw error;
      }

      world.scenario.expectOrderFailure = false;
      return;
    }

    const order = parseOrder(this.history.lastResponseBody);
    this.recordOrder(order);
    world.scenario.expectOrderFailure = false;
  }

  private recordOrder(order: Order): void {
    this.memory.rememberOrder(order);
    this.memory.setTicketAlias("latest", order.ticket);
  }

  private requireRecordedOrder(): Order {
    const world = this.requireWorld();
    return ensure(world.scenario.order, {
      label: "No order has been recorded for the current scenario.",
    })
      .toBeDefined()
      .value;
  }

  private async fetchOrder(ticket: string): Promise<Order> {
    await this.history.track(this.orders.get(ticket));
    ensure(this.history.lastResponse?.status, {
      label: `Expected order fetch to return 200 but was ${this.history.lastResponse?.status ?? "unknown"}.`,
    }).toStrictEqual(200);

    const order = parseOrder(this.history.lastResponseBody);
    this.recordOrder(order);
    return order;
  }

  private requireWorld(): BrewBuddyWorldBase {
    return ensure(this.world, {
      label: "OrdersService is missing world scope binding",
    })
      .toBeDefined()
      .value;
  }

  private ensure() {
    return OrdersService.ensureFactory(this.requireWorld());
  }
}
