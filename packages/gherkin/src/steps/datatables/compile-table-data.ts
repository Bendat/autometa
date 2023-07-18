import { DataTable, TableRow } from "@cucumber/messages";
import { transformTableValue } from "./transform-table-value";
import { Example } from "../../example";
import { CompiledDataTable } from "./compiled-data-table";

export function compileDataTable(
  table?: DataTable,
  example?: Example
): CompiledDataTable | undefined {
  if (!table) {
    return undefined;
  }
  if (table.rows.length === 0) {
    return new CompiledDataTable([], []);
  }
  function transformRowValues({ cells }: TableRow) {
    return cells.map((cell) => transformTableValue(cell, example));
  }
  const raw = table.rows.map(extractRowValues);
  const transformed = table.rows.map(transformRowValues);
  return new CompiledDataTable(transformed, raw);
}

function extractRowValues({ cells }: TableRow) {
  return cells.map((cell) => cell.value);
}


