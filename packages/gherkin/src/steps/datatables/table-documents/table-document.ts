import { Class } from "@autometa/types";
import type { DataTable } from "../table-types";
export abstract class TableDocument<T extends DataTable> {
  static readonly TableType: Class<DataTable>;
  readonly $_table: T;
  readonly $_index: number;
  constructor(table: T, index: number) {
    this.$_table = table;
    this.$_index = index;
  }
}
