import { CompiledDataTable } from "../compiled-data-table";

export abstract class DataTable{
  constructor(raw: CompiledDataTable) {
    this.construct(raw);
  }
  protected abstract construct(raw: CompiledDataTable): void;
}

export function mapHeaders(headers: string[]): { [header: string]: number } {
  return headers.reduce((acc, header, index) => {
    const head = String(header);
    acc[head] = index;
    return acc;
  }, {} as Record<string, number>);
}
