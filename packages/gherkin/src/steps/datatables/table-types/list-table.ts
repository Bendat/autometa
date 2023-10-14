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

  asJson(): Record<string, TableValue[]> {
    const json: Record<number, TableValue[]> = {};
    const length = this.raw.length;
    for (let i = 0; i < length; i++) {
      json[i] = this.raw[i];
    }
    return json;
  }
}