import { ParsedDataTable } from "../../../../../../cucumber/cucumber-runner/src/gherkin/datatables/datatable";
export abstract class TableDocument<T extends ParsedDataTable> {
  constructor(protected _table: T) {}
}
