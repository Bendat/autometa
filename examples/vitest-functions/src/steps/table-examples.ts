import type { TableRecord } from "@autometa/gherkin";

import { Then, When, ensure } from "../step-definitions";

interface Recipe extends TableRecord {
  name: string;
  base: string;
  additions: string;
}

class InventoryRow {
  item = "";
  quantity = 0;
}

Then("the table can be materialised as instances", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const items = table.asInstances(InventoryRow, {
    headerMap: { Item: "item", Quantity: "quantity" },
  });

  if (items.length !== table.rowCount()) {
    throw new Error(`Expected ${table.rowCount()} materialised items but got ${items.length}.`);
  }
  
  for (const instance of items) {
    ensure(world)(typeof instance.item, {
      label: "Inventory item should be a string.",
    }).toStrictEqual("string");
    ensure(world)(typeof instance.quantity, {
      label: "Inventory quantity should be a number.",
    }).toStrictEqual("number");
  }
});

Then("the table preserves raw values when raw true", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const [first] = table.records<TableRecord & { readonly count: string }>({ raw: true });
  
  if (!first) {
    throw new Error("Expected at least one record when materialising with raw=true.");
  }
  
  ensure(world)(typeof first.count, {
    label: "Raw count should remain a string.",
  }).toStrictEqual("string");
});

// Recipe catalog steps
When("I register the following recipes", (world) => {
  const table = world.runtime.requireTable("horizontal");
  const recipes = table.records<Recipe>();
  
  if (!world.scenario.recipes) {
    world.scenario.recipes = [];
  }
  
  for (const recipe of recipes) {
    world.scenario.recipes.push(recipe);
  }
});

Then("each recipe should exist in the recipe catalog", (world) => {
  const recipes = world.scenario.recipes;
  if (!recipes) {
    throw new Error("Recipe catalog should be initialized.");
  }
  if (recipes.length !== 2) {
    throw new Error(`Should have 2 recipes registered, but got ${recipes.length}.`);
  }
});

Then("the recipe {string} should list {string} as an addition", (recipeName, addition, world) => {
  const recipes = world.scenario.recipes;
  if (!recipes) {
    throw new Error("Recipe catalog should be initialized.");
  }
  
  const recipe = recipes.find((r: Recipe) => r.name === recipeName);
  if (!recipe) {
    throw new Error(`Recipe "${recipeName}" should exist in catalog.`);
  }
  
  const additions = recipe.additions.split(",").map(a => a.trim());
  ensure(world)(additions.includes(addition), {
    label: `Recipe "${recipeName}" should include "${addition}" in additions.`,
  }).toBeTruthy();
});

// Tasting notes steps
When("I attach tasting notes for {string}", (recipeName, world) => {
  const docString = world.runtime.consumeDocstring();
  
  if (!docString) {
    throw new Error("Expected a doc string for tasting notes");
  }
  
  if (!world.scenario.tastingNotes) {
    world.scenario.tastingNotes = new Map();
  }
  
  world.scenario.tastingNotes.set(recipeName, docString);
});

Then("the recipe {string} should store the tasting notes", (recipeName, world) => {
  const tastingNotes = world.scenario.tastingNotes;
  if (!tastingNotes) {
    throw new Error("Tasting notes storage should be initialized.");
  }
  
  const notes = tastingNotes.get(recipeName);
  if (!notes) {
    throw new Error(`Tasting notes for "${recipeName}" should exist.`);
  }
  
  ensure(world)(notes.length > 0, {
    label: "Tasting notes should not be empty.",
  }).toBeTruthy();
});

// Brew ratio steps
When("I calculate brew ratio for {string}", (beanName, world) => {
  const table = world.runtime.requireTable("vertical");
  const data = table.getRecord(0) as { "coffee grams": number; "water grams": number };
  
  if (!world.scenario.brewRatios) {
    world.scenario.brewRatios = new Map();
  }
  
  const coffeeGrams = data["coffee grams"];
  const waterGrams = data["water grams"];
  
  if (typeof coffeeGrams !== "number" || typeof waterGrams !== "number") {
    throw new Error("Coffee and water grams must be numbers");
  }
  
  const ratio = `1:${Math.round(waterGrams / coffeeGrams)}`;
  world.scenario.brewRatios.set(beanName, ratio);
});

Then("the brew ratio should equal {string}", (expectedRatio, world) => {
  const brewRatios = world.scenario.brewRatios;
  if (!brewRatios) {
    throw new Error("Brew ratios storage should be initialized.");
  }
  
  // Get the most recently calculated ratio
  const ratios = Array.from(brewRatios.values());
  const actualRatio = ratios[ratios.length - 1];
  
  if (!actualRatio) {
    throw new Error("A brew ratio should have been calculated.");
  }
  
  ensure(world)(actualRatio, {
    label: `Brew ratio should be ${expectedRatio}.`,
  }).toStrictEqual(expectedRatio);
});
