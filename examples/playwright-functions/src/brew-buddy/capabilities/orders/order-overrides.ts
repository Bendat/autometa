import type { VerticalTable } from "@autometa/core/gherkin";

import { normalizeValue } from "../../../utils/json";
import { ORDER_ITEM_FIELDS, type OrderItemField } from "./order-fields";

export type OrderOverrides = Record<string, unknown>;

export function readOrderOverrides(table: VerticalTable): OrderOverrides {
  const record = table.getRecord(0) as Record<string, unknown>;
  const normalised: Record<string, unknown> = {};

  for (const [rawKey, value] of Object.entries(record)) {
    const key = normaliseKey(rawKey);
    normalised[key] = normalizeValue(value);
  }

  return normalised;
}

export function pickOrderItemOverrides(
  source: OrderOverrides
): Partial<Record<OrderItemField, unknown>> {
  const selected: Partial<Record<OrderItemField, unknown>> = {};
  for (const field of ORDER_ITEM_FIELDS) {
    if (field in source) {
      selected[field] = source[field];
    }
  }
  return selected;
}

export function normaliseKey(key: string): string {
  return key.trim().toLowerCase().replace(/\s+/g, " ");
}
