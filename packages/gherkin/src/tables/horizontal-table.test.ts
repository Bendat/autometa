import { describe, expect, it } from "vitest";
import { HorizontalTable } from "./horizontal-table";

const RAW_TABLE = [
  ["first", "second", "flag"],
  ["1", "2", "true"],
  ["3", "4", "false"],
];

describe("HorizontalTable", () => {
  it("requires a header row", () => {
    expect(() => new HorizontalTable([], {} as never)).toThrow(/header row/);
  });

  it("maps rows using headers with primitive coercion", () => {
    const table = new HorizontalTable(RAW_TABLE);
    expect(table.getRow(0)).toEqual({ first: 1, second: 2, flag: true });
    expect(table.getRow(1)).toEqual({ first: 3, second: 4, flag: false });
  });

  it("returns raw values when requested", () => {
    const table = new HorizontalTable(RAW_TABLE);
    expect(table.getColumn("second", { raw: true })).toEqual(["2", "4"]);
  });

  it("supports per-header transformers and injected coercion settings", () => {
    const table = new HorizontalTable(RAW_TABLE, {
      transformers: {
        second: (value) => Number(value) * 10,
      },
      coerce: false,
    });
    expect(table.getRow(0)).toEqual({ first: "1", second: 20, flag: "true" });
  });

  it("retrieves specific cells and throws when missing", () => {
    const table = new HorizontalTable(RAW_TABLE);
    expect(table.getCell("first", 1)).toBe(3);
    expect(table.getCell("missing", 0)).toBeUndefined();
    expect(() => table.getCellOrThrow("first", 5)).toThrow(/row 5/);
  });

  it("exposes raw table structure", () => {
    const table = new HorizontalTable(RAW_TABLE);
    expect(table.raw()).toEqual(RAW_TABLE);
  });
});
