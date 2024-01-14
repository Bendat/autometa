import { Class } from "@autometa/types";
import { CompiledDataTable } from "../compiled-data-table";
import { TableValue } from "../table-value";
import { HTable } from "./horizontal-table";
import { TableDocument } from "../table-documents";

export abstract class DataTable {
  constructor(raw: CompiledDataTable) {
    this.construct(raw);
  }
  protected abstract construct(raw: CompiledDataTable): void;
  abstract get count(): number;
  abstract asJson(): Record<string | number, TableValue[]>;

  static CreateDocument<K extends TableDocument<DataTable>>(
    tableType: Class<DataTable>,
    documentType: Class<K>
  ) {
    return class extends documentType {
      static readonly TableType = tableType;
    };
  }
}

export function mapHeaders(headers: string[]): { [header: string]: number } {
  return headers.reduce((acc, header, index) => {
    const head = String(header);
    acc[head] = index;
    return acc;
  }, {} as Record<string, number>);
}
