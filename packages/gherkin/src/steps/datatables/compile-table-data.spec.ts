import { DataTable, TableRow, TableCell } from "@cucumber/messages";
import { compileDataTable } from "./compile-table-data";
import { describe, it, expect } from "vitest";
describe("compileTableData", () => {
  it("should compile table data", () => {
    const table = new DataTable();
    const titles = new TableRow()
    const cell1 = new TableCell()
    cell1.value = "a"
    const cell2 = new TableCell()
    cell2.value = "b"
    const cell3 = new TableCell()
    cell3.value = "c"

    titles.cells = [cell1, cell2, cell3]
    const row1 = new TableRow()
    const cell11 = new TableCell()
    cell11.value = "1"
    const cell12 = new TableCell()
    cell12.value = "2"
    const cell13 = new TableCell()
    cell13.value = "3"
    row1.cells = [cell11, cell12, cell13]
    table.rows = [
        titles,
        row1
    ];
    const actual = compileDataTable(table);
    const expected = [
        ["a", "b", "c"],
        [1, 2, 3],
    ]
    expect(actual?.table).toEqual(expected);
  });
});
