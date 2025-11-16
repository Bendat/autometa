import { describe, expect, it } from "vitest";
import { createTable } from "./create-table";
import {
  HeaderlessTable,
  HorizontalTable,
  MatrixTable,
  VerticalTable,
} from "./index";

const HEADERLESS_RAW = [
  ["1", "true"],
  ["2", "false"],
];

const HORIZONTAL_RAW = [
  ["id", "flag"],
  ["1", "true"],
];

const VERTICAL_RAW = [
  ["id", "1", "2"],
  ["flag", "true", "false"],
];

const MATRIX_RAW = [
  ["", "col"],
  ["row", "1"],
];

describe("createTable", () => {
  it("creates headerless tables without coercion by default", () => {
    const table = createTable(HEADERLESS_RAW, "headerless");
    expect(table).toBeInstanceOf(HeaderlessTable);
    expect(table.rows()).toEqual([
      ["1", "true"],
      ["2", "false"],
    ]);
  });

  it("creates horizontal tables with coercion enabled by default", () => {
    const table = createTable(HORIZONTAL_RAW, "horizontal");
    expect(table).toBeInstanceOf(HorizontalTable);
    expect(table.getRow(0)).toEqual({ id: 1, flag: true });
  });

  it("creates vertical tables with configurable coercion", () => {
    const table = createTable(VERTICAL_RAW, "vertical", { coerce: false });
    expect(table).toBeInstanceOf(VerticalTable);
    expect(table.getSeries("id")).toEqual(["1", "2"]);
  });

  it("creates matrix tables and honours coercion overrides", () => {
    const table = createTable(MATRIX_RAW, "matrix", { coerce: false });
    expect(table).toBeInstanceOf(MatrixTable);
    expect(table.getCell("row", "col")).toBe("1");
  });

  it("throws for unsupported shapes at runtime", () => {
    expect(() => createTable(HEADERLESS_RAW, "unknown" as never)).toThrow(/Unsupported table shape/);
  });
});
