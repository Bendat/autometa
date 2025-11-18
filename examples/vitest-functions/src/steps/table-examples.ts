import type { TableRecord } from "@autometa/gherkin";

import { Then } from "../step-definitions";
import { assertDefined, assertLength, assertStrictEqual } from "../utils/assertions";

class InventoryRow {
  item = "";
  quantity = 0;
}

Then("the table can be materialised as instances", function () {
  const table = this.runtime.requireTable("horizontal");
  const items = table.asInstances(InventoryRow, {
    headerMap: { Item: "item", Quantity: "quantity" },
  });

  assertLength(items, table.rowCount(), "Materialised items should match row count.");
  for (const instance of items) {
    assertStrictEqual(typeof instance.item, "string", "Inventory item should be a string.");
    assertStrictEqual(typeof instance.quantity, "number", "Inventory quantity should be a number.");
  }
});

Then("the table preserves raw values when raw true", function () {
  const table = this.runtime.requireTable("horizontal");
  const [first] = table.records<TableRecord & { readonly count: string }>({ raw: true });
  const resolved = assertDefined(first, "Expected at least one record when materialising with raw=true.");
  assertStrictEqual(typeof resolved.count, "string", "Raw count should remain a string.");
});
