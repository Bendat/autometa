import { HTTP } from "@autometa/http";

export interface CreateRecipeInput {
  readonly name: string;
  readonly base: string;
  readonly additions: readonly string[];
  readonly season: string;
}

export interface RecipeList {
  readonly recipes: Array<Record<string, unknown>>;
}

/**
 * Domain HTTP client for recipe operations.
 */
export class RecipeClient {
  constructor(private http: HTTP) {}

  private client() {
    return this.http.route("recipes");
  }

  async list() {
    return this.client().get<RecipeList>();
  }

  async getBySlug(slug: string) {
    return this.client().route(slug).get<unknown>();
  }

  async create(recipe: CreateRecipeInput) {
    return this.client().data(recipe).post<unknown>();
  }

  async delete(slug: string) {
    return this.client().route(slug).delete<void>();
  }
}
