import type { PaymentDetails } from "../../../../../.api/src/types/domain.js";

export const ORDER_ITEM_FIELDS = ["size", "shots", "milk", "sweetener"] as const;

export type OrderItemField = (typeof ORDER_ITEM_FIELDS)[number];

export type PaymentMethod = Exclude<PaymentDetails["method"], undefined>;

export const VALID_PAYMENT_METHODS: ReadonlySet<PaymentMethod> = new Set([
  "tap",
  "chip",
  "cash",
  "mobile",
]);
