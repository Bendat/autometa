import { type CompiledDataTable } from "./table-type";
import { TableValue } from "./table-value";

export abstract class ParsedDataTable {
  protected abstract raw: CompiledDataTable;

  readonly toCsv = () => {
    return this.raw.map((row) => row.map((value) => value).join(",")).join("\n") || "";
  };

  abstract asJson(): Record<string | number, TableValue[]>;
}
