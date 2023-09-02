import { TableValue } from "../table-value";
import { CompiledDataTable } from "../compiled-data-table";
import { DataTable, mapHeaders } from "./data-table";
import { AutomationError } from "@autometa/errors";

export class MTable extends DataTable {
  private vheaders: { [header: string]: number };
  private hheaders: { [header: string]: number };
  private rows: TableValue[][];

  protected construct({ table, raw }: CompiledDataTable): void {
    const vheaders = raw.slice(1, raw.length).map(([title]) => title as string);
    const row = raw.at(0) ?? [];
    const hheaders = row.slice(1, row.length).map((it) => it as string) ?? [];
    this.vheaders = mapHeaders(vheaders);
    this.hheaders = mapHeaders(hheaders);
    this.rows = table
      .slice(1, raw.length)
      .map((row) => row.slice(1, row.length));
  }

  get<TReturn = TableValue>(vheader: string, hheader: string): TReturn;
  get<TReturn = TableValue>(
    vheader: string,
    hheader?: string
  ): TReturn | TReturn[] {
    const vIdx = this.vheaders[vheader];
    if (hheader === undefined) {
      return this.rows[vIdx] as TReturn[];
    }
    const hIdx = this.hheaders[hheader];
    
    return this.rows[vIdx][hIdx] as TReturn;
  }

  getRow<T extends [...TableValue[]] = [...TableValue[]]>(
    vheader: TableValue
  ): T {
    const vIdx = this.vheaders[String(vheader)];
    return this.rows[vIdx] as T;
  }

  getCol<T extends [...TableValue[]] = [...TableValue[]]>(
    hheader: TableValue
  ): T {
    const hIdx = this.hheaders[String(hheader)];
    return this.rows.map((row) => row[hIdx]) as T;
  }

  getOrThrow<TReturn = TableValue>(
    vheader: TableValue,
    hheader: TableValue
  ): TReturn;
  getOrThrow<TReturn = TableValue>(vheader: TableValue, hheader: TableValue) {
    const vIdx = this.vheaders[String(vheader)];
    const hIdx = this.hheaders[String(hheader)];
    const vert = this.rows[vIdx];
    if (vert === undefined) {
      throw new AutomationError(`Could not find vertical title ${vheader}`);
    }
    const hor = vert[hIdx] as TReturn;
    if (hor === undefined) {
      throw new AutomationError(
        `Could not find horizontal title ${hheader} from vertical title ${vheader}`
      );
    }
    return hor;
  }
}
