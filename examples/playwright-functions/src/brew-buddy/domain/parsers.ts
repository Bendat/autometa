import type {
  InventoryItem,
  LoyaltyAccount,
} from "../../../../.api/src/types/domain.js";

export function parseLoyalty(payload: unknown): LoyaltyAccount {
  if (payload && typeof payload === "object") {
    const { email, points } = payload as { email?: unknown; points?: unknown };
    if (typeof email === "string" && typeof points === "number") {
      return { email: email.toLowerCase(), points };
    }
  }
  throw new Error("Expected loyalty account details in the latest response body.");
}

export function parseInventory(payload: unknown): InventoryItem {
  if (payload && typeof payload === "object") {
    const { item, quantity } = payload as { item?: unknown; quantity?: unknown };
    if (typeof item === "string" && typeof quantity === "number") {
      return { item, quantity };
    }
  }
  throw new Error("Expected inventory details in the latest response body.");
}
