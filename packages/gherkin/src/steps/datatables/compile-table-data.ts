import { DataTable, TableRow } from "@cucumber/messages";
import {
  interpolateRawValue,
  transformTableValue,
} from "./transform-table-value";
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
  const raw = table.rows.map(extractRowValues.bind(null, example));
  const transformed = table.rows.map(transformRowValues);
  return new CompiledDataTable(transformed, raw);
}

function extractRowValues(example: Example | undefined, { cells }: TableRow) {
  return cells
    .map((cell) => cell.value)
    .map((value) => interpolateRawValue(value, example));
}
