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

  it("supports explicit keys mapping for row/column names", () => {
    const table = new MatrixTable(
      [
        ["", "Reports To", "Team Size"],
        ["Row1", "Ada", "10"],
        ["Row2", "Bob", "12"],
      ],
      {
        coerce: false,
        keys: {
          rows: { Row1: "row1", Row2: "row2" },
          columns: { "Reports To": "reportsTo", "Team Size": "teamSize" },
        } as const,
        transformers: {
          rows: {
            row2: (value) => value.toUpperCase(),
          },
          columns: {
            teamSize: (value) => Number(value) * 2,
          },
          cells: {
            row1: {
              reportsTo: () => "cell-specific",
            },
          },
        },
      }
    );

    // Output keys are mapped
    // Row transformer overrides the column transformer for row2 (cell > row > column)
    expect(table.getRow("row2")).toEqual({ reportsTo: "BOB", teamSize: "12" });
    expect(table.getColumn("teamSize")).toEqual({ row1: 20, row2: "12" });

    // Lookup accepts mapped keys
    expect(table.getCell("row1", "reportsTo")).toBe("cell-specific");
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
