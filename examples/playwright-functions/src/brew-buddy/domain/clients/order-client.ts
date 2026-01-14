import { HTTP } from "@autometa/core/http";
import type { Order, OrderInput } from "../../../../../.api/src/types/domain.js";

/**
 * Domain HTTP client for order operations.
 */
export class OrderClient {
  constructor(private http: HTTP) {}

  private client() {
    return this.http.route("orders");
  }

  async create(order: OrderInput) {
    return this.client().data(order).post<Order>();
  }

  async get(ticket: string) {
    return this.client().route(encodeURIComponent(ticket)).get<Order>();
  }
}
