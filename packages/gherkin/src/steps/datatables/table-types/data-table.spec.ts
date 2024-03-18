import { describe, it, expect } from "vitest";
import { HTable, VTable } from ".";
import { CompiledDataTable } from "../compiled-data-table";

describe("HTable Document", () => {
  class TestDocument extends HTable.Document() {
    @HTable.cell("name")
    name: string;

    @HTable.cell("age")
    age: number;
  }

  it("should be able to get a cell", () => {
    const table = new HTable(
      new CompiledDataTable(
        [
          ["age", "name"],
          [20, "John"],
          [21, "Jane"],
        ],
        [
          ["age", "name"],
          ["20", "John"],
          ["21", "Jane"],
        ]
      )
    );
    const doc = new TestDocument(table, 0);
    const doc2 = new TestDocument(table, 1);

    expect(doc.name).toBe("John");
    expect(doc.age).toBe(20);

    expect(doc2.name).toBe("Jane");
    expect(doc2.age).toBe(21);
  });
});

describe("VTable", () => {
  class TestDocument extends VTable.Document() {
    @VTable.cell("name")
    name: string;

    @VTable.cell("age")
    age: number;
  }

  it("should be able to get a cell", () => {
    const table = new VTable(
      new CompiledDataTable(
        [
          ["name", "John", "Jane"],
          ["age", 20, 21],
        ],
        [
          ["name", "John", "Jane"],
          ["age", "20", "21"],
        ]
      )
    );
    const doc = new TestDocument(table, 0);
    const doc2 = new TestDocument(table, 1);

    expect(doc.name).toBe("John");
    expect(doc.age).toBe(20);

    expect(doc2.name).toBe("Jane");
    expect(doc2.age).toBe(21);
  });
});
