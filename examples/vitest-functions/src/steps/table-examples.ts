import { expect } from "vitest";

import type { TableRecord } from "@autometa/gherkin";

import { Then } from "../step-definitions";

class InventoryRow {
  item = "";
  quantity = 0;
}

Then("the table can be materialised as instances", function () {
  const table = this.runtime.requireTable("horizontal");
  const items = table.asInstances(InventoryRow, {
    headerMap: { Item: "item", Quantity: "quantity" },
  });

  expect(items).toHaveLength(table.rowCount());
  for (const instance of items) {
    expect(typeof instance.item).toBe("string");
    expect(typeof instance.quantity).toBe("number");
  }
});

Then("the table preserves raw values when raw true", function () {
  const table = this.runtime.requireTable("horizontal");
  const [first] = table.records<TableRecord & { readonly count: string }>({ raw: true });
  expect(first).toBeDefined();
  if (!first) {
    return;
  }
  expect(typeof first.count).toBe("string");
});
