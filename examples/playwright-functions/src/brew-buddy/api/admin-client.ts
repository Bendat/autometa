import { HTTP } from "@autometa/http";

export interface ResetAdminInput {
  readonly scopes: readonly string[];
}

/**
 * Domain HTTP client for admin/system operations.
 */
export class AdminClient {
  constructor(private http: HTTP) {}

  private admin() {
    return this.http.route("admin");
  }

  async healthCheck() {
    return this.http.route("health").get<unknown>();
  }

  async reset(input: ResetAdminInput) {
    return this.admin().route("reset").data(input).post<void>();
  }
}
