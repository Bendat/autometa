import { CompiledDataTable } from "../compiled-data-table";
import { TableValue } from "../table-value";

export abstract class DataTable{
  constructor(raw: CompiledDataTable) {
    this.construct(raw);
  }
  protected abstract construct(raw: CompiledDataTable): void;
  abstract asJson(): Record<string | number, TableValue[]>;

}

export function mapHeaders(headers: string[]): { [header: string]: number } {
  return headers.reduce((acc, header, index) => {
    const head = String(header);
    acc[head] = index;
    return acc;
  }, {} as Record<string, number>);

  
}
