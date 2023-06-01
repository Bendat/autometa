import { TableValue } from "./table-value";
import { CompiledDataTable } from "./types";

export abstract class ParsedDataTable {
  protected abstract raw: CompiledDataTable;

  readonly toCsv = () => {
    function collapseRowColumns(row: TableValue[]) {
      return row.map((value) => value).join(",");
    }
    const collapse = this.raw.map(collapseRowColumns).join("\n");
    return collapse ?? "";
  };
}
