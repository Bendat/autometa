import {
  Binding,
  GivenDecorator as Given,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import { extractErrorStatus, performRequest } from "../utils";
import type { BrewBuddyWorld } from "../world";

interface RecipeDefinition {
  readonly base: string;
  readonly additions: readonly string[];
  readonly season: string;
}

const DEFAULT_RECIPES: Record<string, RecipeDefinition> = {
  "Lavender Latte": {
    base: "espresso",
    additions: ["lavender", "oat milk"],
    season: "Spring",
  },
  "Classic Mocha": {
    base: "espresso",
    additions: ["cocoa", "steamed milk", "vanilla"],
    season: "None",
  },
};

function toRecipeSlug(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

@Binding()
export class RecipeSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @Given("a recipe exists named {string}")
  async recipeExists(name: string): Promise<void> {
    const definition = DEFAULT_RECIPES[name];
    if (!definition) {
      throw new Error(`No recipe definition registered for ${name}`);
    }

    const slug = toRecipeSlug(name);

    try {
      await performRequest(this.world, "get", `/recipes/${slug}`);
      ensure.response.hasStatus(200);
      this.world.app.memory.rememberRecipeSlug(name, slug);
      return;
    } catch (error) {
      const status = extractErrorStatus(this.world);
      if (status !== 404) {
        throw error;
      }
    }

    await performRequest(this.world, "post", "/recipes", {
      body: {
        name,
        base: definition.base,
        additions: definition.additions,
        season: definition.season,
      },
    });
    ensure.response.hasStatus(201);
    this.world.app.memory.rememberRecipeSlug(name, slug);
  }

  @Then("the recipe {string} should not be present when I list recipes")
  async recipeShouldNotBePresent(name: string): Promise<void> {
    await performRequest(this.world, "get", "/recipes");
    ensure.response.hasStatus(200);

    const body = this.world.app.lastResponseBody as { recipes?: Array<Record<string, unknown>> } | undefined;
    const recipes = body && Array.isArray(body.recipes) ? body.recipes : [];
    const expectedSlug = this.world.app.memory.resolveRecipeSlug(name);

    const isPresent = recipes.some((recipe) => {
      if (!recipe || typeof recipe !== "object") {
        return false;
      }
      const recipeName = String((recipe as Record<string, unknown>).name ?? "");
      const recipeSlug = String((recipe as Record<string, unknown>).slug ?? toRecipeSlug(recipeName));
      return (
        recipeName.trim().toLowerCase() === name.trim().toLowerCase() ||
        recipeSlug.trim().toLowerCase() === expectedSlug.trim().toLowerCase()
      );
    });

    if (isPresent) {
      throw new Error(`Recipe "${name}" should not appear in the recipe listing.`);
    }
  }
}
