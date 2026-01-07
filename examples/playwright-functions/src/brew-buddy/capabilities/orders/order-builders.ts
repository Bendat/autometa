import type {
  OrderInput,
  OrderItem,
  PaymentDetails,
} from "../../../../../.api/src/types/domain.js";

import {
  VALID_PAYMENT_METHODS,
  type OrderItemField,
  type PaymentMethod,
} from "./order-fields";

export interface SubmitOrderOptions {
  readonly payment?: PaymentDetails;
  readonly includeLoyalty?: boolean;
}

export function buildOrderItem(
  drink: string,
  overrides: Partial<Record<OrderItemField, unknown>>
): OrderItem {
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
  if (
    sweetener !== undefined &&
    sweetener !== null &&
    String(sweetener).trim().length > 0
  ) {
    item.sweetener = String(sweetener);
  }

  return item;
}

export function buildPaymentDetails(
  overrides: Record<string, unknown>
): PaymentDetails | undefined {
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

export function normalizePaymentMethod(
  method: unknown
): PaymentMethod | undefined {
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

export function resolveDrink(
  explicit: string | undefined,
  overrides: Record<string, unknown>
): string {
  if (explicit && explicit.trim().length > 0) {
    return explicit;
  }

  const candidate = overrides.drink ?? overrides.item ?? overrides.name;
  if (typeof candidate === "string" && candidate.trim().length > 0) {
    return candidate;
  }

  throw new Error("Order beverage name could not be determined.");
}
