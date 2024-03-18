import { describe, it, expect } from "vitest";
import { VTable } from "./vertical-table";
import { CompiledDataTable } from "../compiled-data-table";

describe("VTable", () => {
  it("should get a column of values from a vtable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "bob", "jane"],
        ["age", 30, 25],
      ],
      [
        ["name", "bob", "jane"],
        ["age", "30", "25"],
      ]
    );
    const vtable = new VTable(compiled);
    expect(vtable.get("name")).toEqual(["bob", "jane"]);
    expect(vtable.get("age")).toEqual([30, 25]);
  });
  it("should get a specific value from a vtable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "bob", "jane"],
        ["age", 30, 25],
      ],
      [
        ["name", "bob", "jane"],
        ["age", "30", "25"],
      ]
    );
    const vtable = new VTable(compiled);
    expect(vtable.get("name", 0)).toEqual("bob");
    expect(vtable.get("age", 0)).toEqual(30);
  });
  it("should try to get a column of values from a vtable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "bob", "jane"],
        ["age", 30, 25],
      ],
      [
        ["name", "bob", "jane"],
        ["age", "30", "25"],
      ]
    );
    const vtable = new VTable(compiled);

    expect(vtable.getOrThrow("name")).toEqual(["bob", "jane"]);
    expect(vtable.getOrThrow("age")).toEqual([30, 25]);
  });
  it("should get a specific value from a vtable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "bob", "jane"],
        ["age", 30, 25],
      ],
      [
        ["name", "bob", "jane"],
        ["age", "30", "25"],
      ]
    );
    const vtable = new VTable(compiled);

    expect(vtable.get("name", 0)).toEqual("bob");
    expect(vtable.get("name", 1)).toEqual("jane");
    expect(vtable.get("age", 0, true)).toEqual("30");
    expect(vtable.get("age", 1, true)).toEqual("25");
  });

  it("should convert the table to JSON with asJson", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "bob", "jane"],
        ["age", 30, 25],
      ],
      [
        ["name", "bob", "jane"],
        ["age", "30", "25"],
      ]
    );
    const vtable = new VTable(compiled);
    expect(vtable.asJson()).toEqual({
      name: ["bob", "jane"],
      age: [30, 25],
    });
  });
});
