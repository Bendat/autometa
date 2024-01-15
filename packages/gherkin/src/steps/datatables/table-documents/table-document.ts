import { Class } from "@autometa/types";
import type { DataTable } from "../table-types";
export abstract class TableDocument<T extends DataTable> {
  static readonly TableType: Class<DataTable>;
  declare readonly $_table: T;
  declare readonly $_index: number;
  constructor(table: T, index: number) {
    Object.defineProperty(this, "$_table", {
      enumerable: false,
      value: table,
      writable: false,
    });
    Object.defineProperty(this, "$_index", {
      enumerable: false,
      value: index,
      writable: false,
    });
  }
}
