import { DataTable } from "@cucumber/messages";
import { TableValue } from "./table-value";
import { transformTableValue } from "./transform-table-value";
export type CompiledDataTable = TableValue[][];

export type TableType<T> = {
  new (table: CompiledDataTable): T;
};

export function compileDatatable(table?: DataTable): CompiledDataTable | undefined {
  if (!table) {
    return undefined;
  }
  return table.rows.map(({ cells }) => cells.map(transformTableValue));
}
