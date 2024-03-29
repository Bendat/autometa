import { expect, describe, it } from "vitest";
import { HTable } from "./horizontal-table";
import { CompiledDataTable } from "../compiled-data-table";

describe("HTable", () => {
  it("should get a column of values from a htable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "age"],
        ["bob", 30],
        ["jane", 25],
      ],
      [
        ["name", "age"],
        ["bob", "30"],
        ["jane", "25"],
      ]
    );
    const htable = new HTable(compiled);
    expect(htable.get("name")).toEqual(["bob", "jane"]);
    expect(htable.get("age")).toEqual([30, 25]);
  });
  it("should get a specific value from a htable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "age"],
        ["bob", 30],
        ["jane", 25],
        ["joan", 32],
      ],
      [
        ["name", "age"],
        ["bob", "30"],
        ["jane", "25"],
        ["joan", "32"],
      ]
    );
    const htable = new HTable(compiled);
    expect(htable.get("name", 0)).toEqual("bob");
    expect(htable.get("name", 1)).toEqual("jane");
    expect(htable.get("name", 2)).toEqual("joan");
    expect(htable.get("age", 0)).toEqual(30);
    expect(htable.get("age", 1)).toEqual(25);
    expect(htable.get("age", 2)).toEqual(32);
  });
  it("should try to get a column of values from a htable", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "age"],
        ["bob", 30],
        ["jane", 25],
      ],
      [
        ["name", "age"],
        ["bob", "30"],
        ["jane", "25"],
      ]
    );
    const htable = new HTable(compiled);
    expect(htable.getOrThrow("name")).toEqual(["bob", "jane"]);
    expect(htable.getOrThrow("age")).toEqual([30, 25]);
  });

  it("should convert the table to JSON with asJson", () => {
    const compiled = new CompiledDataTable(
      [
        ["name", "age"],
        ["bob", 30],
        ["jane", 25],
      ],
      [
        ["name", "age"],
        ["bob", "30"],
        ["jane", "25"],
      ]
    );
    const htable = new HTable(compiled);
    expect(htable.asJson()).toEqual({
      name: ["bob", "jane"],
      age: [30, 25],
    });
  });
});
