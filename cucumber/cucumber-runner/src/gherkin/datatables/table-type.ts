import { DataTable } from "@cucumber/messages";
import { ParsedDataTable } from "./datatable";
import { TableValue } from "./table-value";
import { transformTableValue } from "./transform-table-value";
export type CompiledDataTable = TableValue[][];

export type TableType<T extends ParsedDataTable> = {
  new (table: CompiledDataTable): T;
};

export function compileDatatable(table?: DataTable): CompiledDataTable | undefined {
  if (!table) {
    return undefined;
  }
  return table.rows.map(({ cells }) => cells.map(transformTableValue));
}
