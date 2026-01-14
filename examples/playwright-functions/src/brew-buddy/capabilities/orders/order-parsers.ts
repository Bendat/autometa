import type { Order } from "../../../../../.api/src/types/domain.js";

export function parseOrder(payload: unknown): Order {
  if (isOrder(payload)) {
    return payload;
  }
  throw new Error("Expected the latest response body to contain an order payload.");
}

export function isOrder(payload: unknown): payload is Order {
  if (!payload || typeof payload !== "object") {
    return false;
  }
  const candidate = payload as Partial<Order>;
  return typeof candidate.ticket === "string" && Array.isArray(candidate.items);
}
