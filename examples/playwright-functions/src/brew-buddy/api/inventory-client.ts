import { HTTP } from "@autometa/core/http";
import type { InventoryItem } from "../../../../.api/src/types/domain.js";

export interface UpdateInventoryInput {
  readonly quantity: number;
}

/**
 * Domain HTTP client for inventory operations.
 */
export class InventoryClient {
  constructor(private http: HTTP) {}

  private client() {
    return this.http.route("inventory");
  }

  async update(item: string, update: UpdateInventoryInput) {
    return this.client()
      .route(encodeURIComponent(item))
      .data(update)
      .patch<InventoryItem>();
  }
}
