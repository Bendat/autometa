import { HTTP } from "@autometa/core/http";
import type { MenuItem } from "../../../../.api/src/types/domain.js";

export interface CreateMenuItemInput {
  readonly name: string;
  readonly price?: number;
  readonly size?: string;
  readonly description?: string;
  readonly season?: string;
  readonly seasonal?: boolean;
}

export interface MenuPriceUpdate {
  readonly name: string;
  readonly price: number;
}

export interface GetMenuQuery extends Record<string, unknown> {
  readonly region?: string;
}

/**
 * Domain HTTP client for menu operations.
 * Uses the HTTP fluent builder interface directly.
 */
export class MenuClient {
  constructor(private http: HTTP) {}

  private client() {
    return this.http.route("menu");
  }

  async get(query?: GetMenuQuery) {
    const scoped = this.client();
    const client = query ? scoped.params(query) : scoped;
    return client.get<{ items: MenuItem[] } | MenuItem[]>();
  }

  async create(item: CreateMenuItemInput) {
    return this.client().data(item).post<MenuItem>();
  }

  async delete(name: string) {
    return this.client().route(encodeURIComponent(name)).delete<void>();
  }

  async updatePrices(updates: readonly MenuPriceUpdate[]) {
    return this.client()
      .route("prices")
      .data({ updates })
      .patch<{ items: MenuItem[] }>();
  }
}
