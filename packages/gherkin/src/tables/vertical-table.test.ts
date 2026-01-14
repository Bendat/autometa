import { describe, expect, it } from "vitest";
import { VerticalTable } from "./vertical-table";

const RAW_TABLE = [
  ["id", "1", "2", "3"],
  ["flag", "true", "false"],
  ["label", "alpha", "beta", "gamma"],
];

describe("VerticalTable", () => {
  it("captures header names and entry count", () => {
    const table = new VerticalTable(RAW_TABLE);
    expect(table.headerNames()).toEqual(["id", "flag", "label"]);
    expect(table.entryCount()).toBe(3);
  });

  it("coerces series values by default", () => {
    const table = new VerticalTable(RAW_TABLE);
    expect(table.getSeries("id")).toEqual([1, 2, 3]);
    expect(table.getSeries("flag")).toEqual([true, false]);
  });

  it("supports transformer overrides and raw access", () => {
    const table = new VerticalTable(RAW_TABLE, {
      coerce: false,
      transformers: {
        label: (value) => value.toUpperCase(),
      },
    });
    expect(table.getRecord(1)).toEqual({ id: "2", flag: "false", label: "BETA" });
    expect(table.getRecord(1, { raw: true })).toEqual({ id: "2", flag: "false", label: "beta" });
  });

  it("supports explicit keys mapping for record keys and transformer lookup", () => {
    const table = new VerticalTable(
      [
        ["Reports To", "Ada", "Bob"],
        ["Team Size", "10", "12"],
      ],
      {
        coerce: false,
        keys: {
          "Reports To": "reportsTo",
          "Team Size": "teamSize",
        } as const,
        transformers: {
          teamSize: (value) => Number(value) * 2,
        },
      }
    );

    expect(table.getRecord(0)).toEqual({ reportsTo: "Ada", teamSize: 20 });
    expect(table.getCell("teamSize", 1)).toBe(24);
    expect(table.getSeries("reportsTo", { raw: true })).toEqual(["Ada", "Bob"]);
  });

  it("retrieves individual cells and validates existence", () => {
    const table = new VerticalTable(RAW_TABLE);
    expect(table.getCell("label", 2)).toBe("gamma");
    expect(table.getCell("missing", 0)).toBeUndefined();
    expect(() => table.getCellOrThrow("flag", 5)).toThrow(/index 5/);
  });

  it("returns raw rows for serialization", () => {
    const table = new VerticalTable(RAW_TABLE);
    expect(table.raw()).toEqual([
      ["id", "1", "2", "3"],
      ["flag", "true", "false"],
      ["label", "alpha", "beta", "gamma"],
    ]);
  });
});
