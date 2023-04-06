import { ParsedDataTable } from "./datatable";
import { TableValue } from "./table-value";

export type CompiledDataTable = TableValue[][];

export type TableType<T extends ParsedDataTable> = {
  new (table: CompiledDataTable): T;
};
