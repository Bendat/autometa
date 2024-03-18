import { DataTable } from "@cucumber/messages";
import { ParsedDataTable } from "./datatable";
export type CompiledDataTable = string[][];

export type TableType<T extends ParsedDataTable> = {
  new (table: CompiledDataTable): T;
};

export function compileDatatable(table?: DataTable): CompiledDataTable | undefined {
  if (!table) {
    return undefined;
  }
  return table.rows.map(({ cells }) => cells.map((cell) => cell.value));
}
