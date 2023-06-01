import { TableValue } from "../datatables-old/table-value";
import { CompiledDataTable } from "../datatables-old/types";
import { Bind } from "@autometa/bind-decorator";

export abstract class DataTable{
  constructor(raw: CompiledDataTable) {
    this.construct(raw);
  }
  protected abstract construct(raw: CompiledDataTable): void;
}
/**
 * TODO - generics for 'get
 */
export class HTable extends DataTable {
  private headers: { [header: string]: number };
  private rows: readonly TableValue[][];
  @Bind
  protected construct(raw: CompiledDataTable): void {
    const [headers, ...rows] = raw as [string[], TableValue[]];
    this.rows = rows;
    this.headers = mapHeaders(headers);
  }

  get(header: TableValue): TableValue[];
  get(header: TableValue, row: number): TableValue;
  @Bind
  get(header: TableValue, row?: number): TableValue | TableValue[] {
    const colIdx = this.headers[String(header)];
    const column = this.rows.map((row) => row[colIdx]);
    if (row !== undefined) {
      return column[row];
    }
    return column;
  }

  getOrThrow(header: TableValue): TableValue[];
  getOrThrow(header: TableValue, row: number): TableValue;
  @Bind
  getOrThrow(header: TableValue, row?: number): TableValue | TableValue[] {
    const result = this.get(header, row as number);
    if (result === undefined) {
      const rowSug = row !== undefined ? ` at row ${row}` : "";
      const maxSize = Math.max(...this.rows.map((row) => row.length));
      const maxSizeSlug = ` (max size ${maxSize})`;
      const message = `Could not find column ${header}${rowSug}${maxSizeSlug}}`;
      throw new Error(message);
    }
    return result;
  }
}

type GetReturnType<T extends TableValue | TableValue[]> = T extends [...infer K]
  ? K
  : T extends infer J
  ? J
  : T extends TableValue[]
  ? TableValue[]
  : TableValue;

export class VTable extends DataTable {
  private headers: { [header: string]: number };
  private columns: readonly TableValue[][];
  protected construct(raw: CompiledDataTable): void {
    const headers = raw.map(([title]) => String(title));
    this.headers = mapHeaders(headers);
    this.columns = raw.map(([_, ...rows]) => rows);
  }
  get<TReturn extends TableValue[] = TableValue[]>(
    header: TableValue
  ): GetReturnType<TReturn>;
  get<TReturn extends TableValue = TableValue>(
    header: TableValue,
    row: number
  ): GetReturnType<TReturn>;
  @Bind
  get<TReturn extends TableValue | TableValue[]>(
    header: TableValue,
    column?: number
  ) {
    const rowIdx = this.headers[String(header)];
    const row = this.columns[rowIdx];
    if (column !== undefined) {
      return row[column] as TReturn;
    }
    return row as TReturn;
  }

  getOrThrow<TReturn extends TableValue[] = TableValue[]>(
    header: TableValue
  ): TReturn;
  getOrThrow<TReturn extends TableValue = TableValue>(
    header: TableValue,
    column: number
  ): TReturn;
  @Bind
  getOrThrow(header: TableValue, column?: number): TableValue | TableValue[] {
    const result = this.get(header, column as number);
    if (result === undefined) {
      const colSug = column !== undefined ? ` at column ${column}` : "";
      const maxSize = Math.max(...this.columns.map((col) => col.length));
      const maxSizeSlug = ` (max size ${maxSize})`;
      throw new Error(`Could not find row ${header}${colSug}${maxSizeSlug}}`);
    }
    return result;
  }
}

export class NeverDataTable extends DataTable {
  node: "You shouldn't be seeing this";
  protected construct(): void {
    throw new Error("NeverDataTable should never be constructed");
  }
}

export class MTable extends DataTable {
  private vheaders: { [header: string]: number };
  private hheaders: { [header: string]: number };
  private rows: TableValue[][];

  protected construct(raw: CompiledDataTable): void {
    const vheaders = raw.slice(1, raw.length).map(([title]) => title as string);
    const row = raw.at(0) ?? [];
    const hheaders = row.slice(1, row.length).map((it) => it as string) ?? [];
    this.vheaders = mapHeaders(vheaders);
    this.hheaders = mapHeaders(hheaders);
    this.rows = raw.slice(1, raw.length).map((row) => row.slice(1, row.length));
  }

  get<TReturn = TableValue>(vheader: TableValue, hheader: TableValue): TReturn;
  get<TReturn = TableValue>(
    vheader: TableValue,
    hheader?: TableValue
  ): TReturn | TReturn[] {
    const vIdx = this.vheaders[String(vheader)];
    const hIdx = this.hheaders[String(hheader)];
    return this.rows[vIdx][hIdx] as TReturn;
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
      throw new Error(`Could not find vertical title ${vheader}`);
    }
    const hor = vert[hIdx] as TReturn;
    if (hor === undefined) {
      throw new Error(
        `Could not find horizontal title ${hheader} from vertical title ${vheader}`
      );
    }
    return hor;
  }
}

function mapHeaders(headers: string[]): { [header: string]: number } {
  return headers.reduce((acc, header, index) => {
    const head = String(header);
    acc[head] = index;
    return acc;
  }, {} as Record<string, number>);
}
