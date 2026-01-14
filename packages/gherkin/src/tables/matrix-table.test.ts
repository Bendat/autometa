import { describe, expect, it } from "vitest";
import { MatrixTable } from "./matrix-table";

const RAW_TABLE = [
  ["", "colA", "colB"],
  ["row1", "1", "true"],
  ["row2", "2", "false"],
];

describe("MatrixTable", () => {
  it("exposes horizontal and vertical headers", () => {
    const table = new MatrixTable(RAW_TABLE);
    expect(table.horizontal()).toEqual(["colA", "colB"]);
    expect(table.vertical()).toEqual(["row1", "row2"]);
  });

  it("coerces matrix values and provides row/column access", () => {
    const table = new MatrixTable(RAW_TABLE);
    expect(table.getRow("row1")).toEqual({ colA: 1, colB: true });
    expect(table.getColumn("colB")).toEqual({ row1: true, row2: false });
    expect(table.getCell("row2", "colA")).toBe(2);
  });

  it("respects transformation precedence: cell > row > column", () => {
    const table = new MatrixTable(RAW_TABLE, {
      coerce: false,
      transformers: {
        columns: {
          colA: (value) => Number(value) * 10,
        },
        rows: {
          row1: (value) => `${value}-R1`,
        },
        cells: {
          row2: {
            colB: () => "cell-specific",
          },
        },
      },
    });
    expect(table.getRow("row1")).toEqual({ colA: "1-R1", colB: "true-R1" });
    expect(table.getCell("row2", "colB")).toBe("cell-specific");
    expect(table.getCell("row2", "colA")).toBe(20);
  });

  it("throws when requesting missing coordinates", () => {
    const table = new MatrixTable(RAW_TABLE);
    expect(table.getCell("missing", "colA")).toBeUndefined();
    expect(() => table.getCellOrThrow("row1", "missing")).toThrow(/does not exist/);
  });

  it("returns the original matrix for raw()", () => {
    const table = new MatrixTable(RAW_TABLE);
    expect(table.raw()).toEqual([
      ["", "colA", "colB"],
      ["row1", "1", "true"],
      ["row2", "2", "false"],
    ]);
  });
});
