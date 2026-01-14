import { HTTP } from "@autometa/core/http";
import type { LoyaltyAccount } from "../../../../.api/src/types/domain.js";

export interface UpdateLoyaltyInput {
  readonly points: number;
}

/**
 * Domain HTTP client for loyalty operations.
 */
export class LoyaltyClient {
  constructor(private http: HTTP) {}

  private client() {
    return this.http.route("loyalty");
  }

  async get(email: string) {
    return this.client().route(encodeURIComponent(email)).get<LoyaltyAccount>();
  }

  async update(email: string, update: UpdateLoyaltyInput) {
    return this.client()
      .route(encodeURIComponent(email))
      .data(update)
      .patch<LoyaltyAccount>();
  }
}
