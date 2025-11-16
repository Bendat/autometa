import { describe, expect, it } from "vitest";
import {
  HeaderlessTable,
  HorizontalTable,
  MatrixTable,
  VerticalTable,
  createTable,
} from "./index";

describe("HeaderlessTable", () => {
  const raw = [
    ["1", "true"],
    ["2", "false"],
  ];

  it("returns raw rows by default", () => {
    const table = new HeaderlessTable(raw);
    expect(table.rows()).toEqual([
      ["1", "true"],
      ["2", "false"],
    ]);
  });

  it("coerces when requested", () => {
    const table = new HeaderlessTable(raw, { coerce: true });
    expect(table.rows()).toEqual([
      [1, true],
      [2, false],
    ]);
  });
});

describe("HorizontalTable", () => {
  const raw = [
    ["first", "second"],
    ["1", "true"],
    ["2", "false"],
  ];

  it("coerces by default", () => {
    const table = new HorizontalTable(raw);
    expect(table.getRow(0)).toEqual({ first: 1, second: true });
  });

  it("allows raw access", () => {
    const table = new HorizontalTable(raw);
    expect(table.getRow(1, { raw: true })).toEqual({ first: "2", second: "false" });
  });

  it("supports createTable factory", () => {
    const table = createTable(raw, "horizontal");
    expect(table).toBeInstanceOf(HorizontalTable);
  });
});

describe("VerticalTable", () => {
  const raw = [
    ["first", "1", "2"],
    ["second", "true", "false"],
  ];

  it("creates series per header", () => {
    const table = new VerticalTable(raw);
    expect(table.getSeries("first")).toEqual([1, 2]);
    expect(table.getRecord(1)).toEqual({ first: 2, second: false });
  });
});

describe("MatrixTable", () => {
  const raw = [
    ["", "colA", "colB"],
    ["row1", "1", "true"],
    ["row2", "2", "false"],
  ];

  it("resolves rows and columns", () => {
    const table = new MatrixTable(raw);
    expect(table.getRow("row1")).toEqual({ colA: 1, colB: true });
    expect(table.getColumn("colB")).toEqual({ row1: true, row2: false });
  });
});
