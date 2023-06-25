import { Docstring } from "../doc-string";
import { DocString } from "@cucumber/messages";
import { type CompiledDataTable } from "./table-type";

export function getTableOrDocstring(
  dataTable: CompiledDataTable | undefined,
  docString: DocString | undefined
  // tableType: TableType<unknown>
) {
  if (dataTable) {
    return dataTable;
  }
  if (docString) {
    return new Docstring(docString);
  }
  return undefined;
}
