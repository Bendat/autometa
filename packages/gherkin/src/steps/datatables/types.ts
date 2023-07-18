import { DataTable } from "./datatable";
import { TableValue } from "./table-value";

export type CompiledDataTable = TableValue[][];

export type TableType<T extends DataTable> = {
  new (table: CompiledDataTable): T;
};
