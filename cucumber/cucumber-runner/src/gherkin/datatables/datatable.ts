import { type CompiledDataTable } from "./table-type";

export abstract class ParsedDataTable {
  protected abstract raw: CompiledDataTable;

  readonly toCsv = () => {
    return this.raw.map((row) => row.map((value) => value).join(",")).join("\n") || "";
  };

}
