import { describe, it, expect } from "vitest";
import { HTable, MTable, VTable } from "./data-table";

describe("VTable", () => {
  it("should get a row of values from a vtable", () => {
    const vtable = new VTable([
      ["name", "bob", "jane"],
      ["age", 30, 25],
    ]);
    expect(vtable.get("name")).toEqual(["bob", "jane"]);
    expect(vtable.get("age")).toEqual([30, 25]);
  });
  it("should try to get a column of values from a vtable", () => {
    const vtable = new VTable([
      ["name", "bob", "jane"],
      ["age", 30, 25],
    ]);
    expect(vtable.getOrThrow("name")).toEqual(["bob", "jane"]);
    expect(vtable.getOrThrow("age")).toEqual([30, 25]);
  });
  it("should get a specific value from a vtable", () => {
    const vtable = new VTable([
      ["name", "bob", "jane"],
      ["age", "30", "25"],
    ]);
    expect(vtable.get("name", 0)).toEqual("bob");
    expect(vtable.get("name", 1)).toEqual("jane");
    expect(vtable.get("age", 0)).toEqual("30");
    expect(vtable.get("age", 1)).toEqual("25");
  });
});
describe("HTable", () => {
  it("should get a column of values from a htable", () => {
    const htable = new HTable([
      ["name", "age"],
      ["bob", 30],
      ["jane", 25],
    ]);
    expect(htable.get("name")).toEqual(["bob", "jane"]);
    expect(htable.get("age")).toEqual([30, 25]);
  });
  it("should get a specific value from a htable", () => {
    const htable = new HTable([
      ["name", "age"],
      ["bob", 30],
      ["jane", 25],
    ]);
    expect(htable.get("name", 0)).toEqual("bob");
    expect(htable.get("name", 1)).toEqual("jane");
    expect(htable.get("age", 0)).toEqual(30);
    expect(htable.get("age", 1)).toEqual(25);
  });
  it("should try to get a column of values from a htable", () => {
    const htable = new HTable([
      ["name", "age"],
      ["bob", 30],
      ["jane", 25],
    ]);
    expect(htable.getOrThrow("name")).toEqual(["bob", "jane"]);
    expect(htable.getOrThrow("age")).toEqual([30, 25]);
  });
});
describe("MTable", () => {
  it("should get a value from a mtable", () => {
    const mtable = new MTable([
      ["", "dry", "wet"],
      ["hard", "stone", "ice"],
      ["soft", "pillow", "water"],
    ]);

    expect(mtable.get("hard", "dry")).toEqual('stone');
    expect(mtable.get("soft", "dry")).toEqual('pillow');
    expect(mtable.get("hard", "wet")).toEqual('ice');
    expect(mtable.get("soft", "wet")).toEqual('water');
  });
  
});
