import { TableValue } from "./table-value";

export class CompiledDataTable {
  constructor(readonly table: TableValue[][], readonly raw: string[][]) {}
}
