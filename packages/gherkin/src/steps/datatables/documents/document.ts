import { DataTable } from "../table-types";

export abstract class DataTableDocument<TTableType extends DataTable> {
  constructor(protected readonly table: TTableType) {}
}
