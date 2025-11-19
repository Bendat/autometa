import type { TableRecord } from "@autometa/gherkin";

import { Then, When } from "../step-definitions";
import { assertStrictEqual } from "../utils/assertions";

interface Recipe extends TableRecord {
  name: string;
  base: string;
  additions: string;
}

class InventoryRow {
  item = "";
  quantity = 0;
}

Then("the table can be materialised as instances", function () {
  const table = this.runtime.requireTable("horizontal");
  const items = table.asInstances(InventoryRow, {
    headerMap: { Item: "item", Quantity: "quantity" },
  });

  if (items.length !== table.rowCount()) {
    throw new Error(`Expected ${table.rowCount()} materialised items but got ${items.length}.`);
  }
  
  for (const instance of items) {
    assertStrictEqual(typeof instance.item, "string", "Inventory item should be a string.");
    assertStrictEqual(typeof instance.quantity, "number", "Inventory quantity should be a number.");
  }
});

Then("the table preserves raw values when raw true", function () {
  const table = this.runtime.requireTable("horizontal");
  const [first] = table.records<TableRecord & { readonly count: string }>({ raw: true });
  
  if (!first) {
    throw new Error("Expected at least one record when materialising with raw=true.");
  }
  
  assertStrictEqual(typeof first.count, "string", "Raw count should remain a string.");
});

// Recipe catalog steps
When("I register the following recipes", function () {
  const table = this.runtime.requireTable("horizontal");
  const recipes = table.records<Recipe>();
  
  if (!this.scenario.recipes) {
    this.scenario.recipes = [];
  }
  
  for (const recipe of recipes) {
    this.scenario.recipes.push(recipe);
  }
});

Then("each recipe should exist in the recipe catalog", function () {
  const recipes = this.scenario.recipes;
  if (!recipes) {
    throw new Error("Recipe catalog should be initialized.");
  }
  if (recipes.length !== 2) {
    throw new Error(`Should have 2 recipes registered, but got ${recipes.length}.`);
  }
});

Then("the recipe {string} should list {string} as an addition", function (recipeName: string, addition: string) {
  const recipes = this.scenario.recipes;
  if (!recipes) {
    throw new Error("Recipe catalog should be initialized.");
  }
  
  const recipe = recipes.find((r: Recipe) => r.name === recipeName);
  if (!recipe) {
    throw new Error(`Recipe "${recipeName}" should exist in catalog.`);
  }
  
  const additions = recipe.additions.split(",").map(a => a.trim());
  assertStrictEqual(
    additions.includes(addition),
    true,
    `Recipe "${recipeName}" should include "${addition}" in additions.`
  );
});

// Tasting notes steps
When("I attach tasting notes for {string}", function (recipeName: string) {
  const docString = this.runtime.consumeDocstring();
  
  if (!docString) {
    throw new Error("Expected a doc string for tasting notes");
  }
  
  if (!this.scenario.tastingNotes) {
    this.scenario.tastingNotes = new Map();
  }
  
  this.scenario.tastingNotes.set(recipeName, docString);
});

Then("the recipe {string} should store the tasting notes", function (recipeName: string) {
  const tastingNotes = this.scenario.tastingNotes;
  if (!tastingNotes) {
    throw new Error("Tasting notes storage should be initialized.");
  }
  
  const notes = tastingNotes.get(recipeName);
  if (!notes) {
    throw new Error(`Tasting notes for "${recipeName}" should exist.`);
  }
  
  assertStrictEqual(notes.length > 0, true, "Tasting notes should not be empty.");
});

// Brew ratio steps
When("I calculate brew ratio for {string}", function (beanName: string) {
  const table = this.runtime.requireTable("vertical");
  const data = table.getRecord(0) as { "coffee grams": number; "water grams": number };
  
  if (!this.scenario.brewRatios) {
    this.scenario.brewRatios = new Map();
  }
  
  const coffeeGrams = data["coffee grams"];
  const waterGrams = data["water grams"];
  
  if (typeof coffeeGrams !== "number" || typeof waterGrams !== "number") {
    throw new Error("Coffee and water grams must be numbers");
  }
  
  const ratio = `1:${Math.round(waterGrams / coffeeGrams)}`;
  this.scenario.brewRatios.set(beanName, ratio);
});

Then("the brew ratio should equal {string}", function (expectedRatio: string) {
  const brewRatios = this.scenario.brewRatios;
  if (!brewRatios) {
    throw new Error("Brew ratios storage should be initialized.");
  }
  
  // Get the most recently calculated ratio
  const ratios = Array.from(brewRatios.values());
  const actualRatio = ratios[ratios.length - 1];
  
  if (!actualRatio) {
    throw new Error("A brew ratio should have been calculated.");
  }
  
  assertStrictEqual(actualRatio, expectedRatio, `Brew ratio should be ${expectedRatio}.`);
});
