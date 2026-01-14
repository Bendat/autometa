import type { TableRecord } from "@autometa/gherkin";
import {
  Binding,
  WhenDecorator as When,
  ThenDecorator as Then,
  Inject,
  WORLD_TOKEN,
  ensure,
} from "../step-definitions";
import type { BrewBuddyWorld } from "../world";

interface Recipe extends TableRecord {
  name: string;
  base: string;
  additions: string;
}

class InventoryRow {
  item = "";
  quantity = 0;
}

@Binding()
export class TableExamplesSteps {
  constructor(@Inject(WORLD_TOKEN) private world: BrewBuddyWorld) {}

  @Then("the table can be materialised as instances")
  tableMaterialisedAsInstances(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const items = table.asInstances(InventoryRow, {
      headerMap: { Item: "item", Quantity: "quantity" },
    });

    if (items.length !== table.rowCount()) {
      throw new Error(`Expected ${table.rowCount()} materialised items but got ${items.length}.`);
    }
    
    for (const instance of items) {
      ensure(typeof instance.item, {
        label: "Inventory item should be a string.",
      }).toStrictEqual("string");
      ensure(typeof instance.quantity, {
        label: "Inventory quantity should be a number.",
      }).toStrictEqual("number");
    }
  }

  @Then("the table preserves raw values when raw true")
  tablePreservesRawValues(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const [first] = table.records<TableRecord & { readonly count: string }>({ raw: true });
    
    if (!first) {
      throw new Error("Expected at least one record when materialising with raw=true.");
    }
    
    ensure(typeof first.count, {
      label: "Raw count should remain a string.",
    }).toStrictEqual("string");
  }

  // Recipe catalog steps
  @When("I register the following recipes")
  registerRecipes(): void {
    const table = this.world.runtime.requireTable("horizontal");
    const recipes = table.records<Recipe>();
    
    if (!this.world.scenario.recipes) {
      this.world.scenario.recipes = [];
    }
    
    for (const recipe of recipes) {
      this.world.scenario.recipes.push(recipe);
    }
  }

  @Then("each recipe should exist in the recipe catalog")
  recipesExistInCatalog(): void {
    const recipes = this.world.scenario.recipes;
    if (!recipes) {
      throw new Error("Recipe catalog should be initialized.");
    }
    if (recipes.length !== 2) {
      throw new Error(`Should have 2 recipes registered, but got ${recipes.length}.`);
    }
  }

  @Then("the recipe {string} should list {string} as an addition")
  recipeListsAddition(recipeName: string, addition: string): void {
    const recipes = this.world.scenario.recipes;
    if (!recipes) {
      throw new Error("Recipe catalog should be initialized.");
    }
    
    const recipe = recipes.find((r: Recipe) => r.name === recipeName);
    if (!recipe) {
      throw new Error(`Recipe "${recipeName}" should exist in catalog.`);
    }
    
    const additions = recipe.additions.split(",").map((a: string) => a.trim());
    ensure(additions.includes(addition), {
      label: `Recipe "${recipeName}" should include "${addition}" in additions.`,
    }).toBeTruthy();
  }

  @Then("I log the current step metadata")
  logStepMetadata(): void {
    const metadata = this.world.runtime.getStepMetadata();
    if (!metadata) {
      console.log("No step metadata available");
      return;
    }
    console.log("Step metadata:", JSON.stringify(metadata, null, 2));
  }

  // Tasting notes steps
  @When("I attach tasting notes for {string}")
  attachTastingNotes(recipeName: string): void {
    const docString = this.world.runtime.consumeDocstring();
    
    if (!docString) {
      throw new Error("Expected a doc string for tasting notes");
    }
    
    if (!this.world.scenario.tastingNotes) {
      this.world.scenario.tastingNotes = new Map();
    }
    
    this.world.scenario.tastingNotes.set(recipeName, docString);
  }

  @Then("the recipe {string} should store the tasting notes")
  recipeStoresTastingNotes(recipeName: string): void {
    const tastingNotes = this.world.scenario.tastingNotes;
    if (!tastingNotes) {
      throw new Error("Tasting notes storage should be initialized.");
    }
    
    const notes = tastingNotes.get(recipeName);
    if (!notes) {
      throw new Error(`Tasting notes for "${recipeName}" should exist.`);
    }
    
    ensure(notes.length > 0, {
      label: "Tasting notes should not be empty.",
    }).toBeTruthy();
  }

  // Brew ratio steps
  @When("I calculate brew ratio for {string}")
  calculateBrewRatio(beanName: string): void {
    const table = this.world.runtime.requireTable("vertical");
    const data = table.getRecord(0) as { "coffee grams": number; "water grams": number };
    
    if (!this.world.scenario.brewRatios) {
      this.world.scenario.brewRatios = new Map();
    }
    
    const coffeeGrams = data["coffee grams"];
    const waterGrams = data["water grams"];
    
    if (typeof coffeeGrams !== "number" || typeof waterGrams !== "number") {
      throw new Error("Coffee and water grams must be numbers");
    }
    
    const ratio = `1:${Math.round(waterGrams / coffeeGrams)}`;
    this.world.scenario.brewRatios.set(beanName, ratio);
  }

  @Then("the brew ratio should equal {string}")
  brewRatioEquals(expectedRatio: string): void {
    const brewRatios = this.world.scenario.brewRatios;
    if (!brewRatios) {
      throw new Error("Brew ratios storage should be initialized.");
    }
    
    // Get the most recently calculated ratio
    const ratios = Array.from(brewRatios.values());
    const actualRatio = ratios[ratios.length - 1];
    
    if (!actualRatio) {
      throw new Error("A brew ratio should have been calculated.");
    }
    
    ensure(actualRatio, {
      label: `Brew ratio should be ${expectedRatio}.`,
    }).toStrictEqual(expectedRatio);
  }
}
