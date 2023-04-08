import { DataTable, TableRow } from "@cucumber/messages";
import { CompiledDataTable } from ".";
import { transformTableValue } from "./transform-table-value";

export function compileDatatable(
  table?: DataTable
): CompiledDataTable | undefined {
  if (!table) {
    return undefined;
  }
  if (table.rows.length === 0) {
    return undefined;
  }
  function transformRowValues({ cells }: TableRow) {
    return cells.map(transformTableValue);
  }
  return table.rows.map(transformRowValues);
}
