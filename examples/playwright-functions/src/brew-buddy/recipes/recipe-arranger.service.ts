import { HTTPError } from "@autometa/core/http";

import { HttpHistoryService } from "../http/http-history.service";
import type { BrewBuddyMemoryService } from "../state/memory.service";
import { RecipeClient, toRecipeSlug } from "../api/recipe-client";
import { RecipeCatalogService } from "./recipe-catalog.service";

/**
 * Scenario-scoped orchestration for recipe setup.
 *
 * Keeps step definitions thin by handling:
 * - fixture lookup
 * - slug generation
 * - get-or-create flow
 * - history + alias recording
 */
export class RecipeArrangerService {
  constructor(
    private readonly history: HttpHistoryService,
    private readonly recipes: RecipeClient,
    private readonly memory: BrewBuddyMemoryService,
    private readonly catalog: RecipeCatalogService
  ) {}

  async ensureExists(name: string): Promise<void> {
    const definition = this.catalog.getRequired(name);
    const slug = toRecipeSlug(name);

    try {
      const response = await this.history.track(this.recipes.getBySlug(slug));
      if (response.status !== 200) {
        throw new Error(`Expected GET /recipes/${slug} to return 200 but got ${response.status}`);
      }
      this.memory.rememberRecipeSlug(name, slug);
      return;
    } catch (error) {
      if (error instanceof HTTPError && error.response?.status === 404) {
        // continue to create
      } else {
        throw error;
      }
    }

    const created = await this.history.track(
      this.recipes.create({
        name,
        base: definition.base,
        additions: definition.additions,
        season: definition.season,
      })
    );

    if (created.status !== 201) {
      throw new Error(`Expected POST /recipes to return 201 but got ${created.status}`);
    }

    this.memory.rememberRecipeSlug(name, slug);
  }
}
