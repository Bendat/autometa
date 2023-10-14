import { AutomationError } from "@autometa/errors";
import { DataTable } from "./data-table";
import { TableValue } from "../table-value";


export class NeverDataTable extends DataTable {
  asJson(): Record<string | number, TableValue[]> {
    throw new Error("Method not implemented.");
  }
  node: "You shouldn't be seeing this";
  protected construct(): void {
    throw new AutomationError(`NeverDataTable should never be constructed. Did you forget to specify a table type in your step definition?
Given('my step with table', (table: HTable) => {}, HTable)

Default options are HTable, VTable, MTable, and NeverDataTable`);
  }
}
