export interface RecipeDefinition {
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

/**
 * Injectable fixture registry for recipe definitions.
 */
export class RecipeCatalogService {
  constructor(private readonly recipes: Record<string, RecipeDefinition> = DEFAULT_RECIPES) {}

  getRequired(name: string): RecipeDefinition {
    const def = this.recipes[name];
    if (!def) {
      throw new Error(`No recipe definition registered for ${name}`);
    }
    return def;
  }
}
