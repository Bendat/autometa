import { describe, expect, it } from "vitest";
import { HeaderlessTable } from "./headerless-table";

const RAW_TABLE = [
  ["1", "true", "alpha"],
  ["2", "false"],
];

describe("HeaderlessTable", () => {
  it("tracks table dimensions", () => {
    const table = new HeaderlessTable(RAW_TABLE);
    expect(table.rowCount()).toBe(2);
    expect(table.columnCount()).toBe(3);
  });

  it("returns raw values by default", () => {
    const table = new HeaderlessTable(RAW_TABLE);
    expect(table.rows()).toEqual([
      ["1", "true", "alpha"],
      ["2", "false"],
    ]);
  });

  it("coerces primitives when enabled", () => {
    const table = new HeaderlessTable(RAW_TABLE, { coerce: true });
    expect(table.rows()).toEqual([
      [1, true, "alpha"],
      [2, false],
    ]);
  });

  it("applies column transformers before coercion", () => {
    const table = new HeaderlessTable(RAW_TABLE, {
      transformers: {
        1: (value) => value.toUpperCase(),
      },
    });
    expect(table.row(0)).toEqual(["1", "TRUE", "alpha"]);
  });

  it("honours raw access flag even when coercion is enabled", () => {
    const table = new HeaderlessTable(RAW_TABLE, { coerce: true });
    expect(table.row(1, { raw: true })).toEqual(["2", "false"]);
  });

  it("resolves individual cells and throws for missing ones", () => {
    const table = new HeaderlessTable(RAW_TABLE, { coerce: true });
    expect(table.cell(0, 1)).toBe(true);
    expect(() => table.cellOrThrow(5, 0)).toThrow(/does not exist/);
    expect(table.cell(1, 2)).toBeUndefined();
  });
});
