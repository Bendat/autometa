import { CompiledDataTable } from "../compiled-data-table";
import { TableValue } from "../table-value";
import { DataTable } from "./data-table";

export class ListTable extends DataTable {
  protected table: TableValue[][];
  protected raw: string[][];
  protected construct({ table, raw }: CompiledDataTable) {
    this.table = table;
    this.raw = raw;
  }
}