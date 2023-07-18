import { TableValue } from "../table-value";
import { CompiledDataTable } from "../compiled-data-table";
import { Bind } from "@autometa/bind-decorator";
import { DataTable } from "./data-table";
import { overloads, def, string, number, boolean } from "@autometa/overloaded";

export class VTable extends DataTable {
  private headers: string[];
  private columns: readonly TableValue[][];
  private rawColumns: readonly string[][];
  private headerMapping: { [key: string]: number };

  protected construct({ table, raw }: CompiledDataTable): void {
    this.headerMapping = {};
    this.headers = raw.map(([title]) => String(title));
    this.columns = table.map(([_, ...rows]) => rows);
    this.rawColumns = raw.map(([_, ...rows]) => rows);
    const mapHeaders = (header: string, idx: number) => {
      const mapping = this.headerMapping
      mapping[header] = idx;
    };
    this.headers.forEach(mapHeaders);
  }
  get<T extends [...TableValue[]] = [...TableValue[]]>(
    header: string,
    raw?: boolean
  ): T;
  get<T extends TableValue = TableValue>(
    header: string,
    col: number,
    raw?: boolean
  ): T;
  @Bind
  get<T extends TableValue = TableValue>(
    ...args: (string | number | boolean | undefined)[]
  ) {
    // const rowIdx = this.headers[String(header)];
    // const row = this.columns[rowIdx];
    // if (column !== undefined) {
    //   return row[column] as TReturn;
    // }
    return overloads(
      def(string(), number(), boolean()).matches((header, col, raw) => {
        const rowIdx = this.headerMapping[header];
        const source = raw === true ? this.rawColumns : this.columns;
        const column = source[rowIdx];
        this.handleError(rowIdx, source, header, col);
        return column[col] as T;
      }),
      def(string(), number()).matches((header, col) => {
        const rowIdx = this.headerMapping[header];
        const source = this.columns;
        const column = source[rowIdx];
        this.handleError(rowIdx, source, header, col);
        return column[col] as T;
      }),
      def(string(), boolean()).matches((header, raw) => {
        const colIdx = this.headerMapping[header];
        const source = raw === true ? this.rawColumns : this.columns;
        return source[colIdx] as T[];
      }),
      def(string()).matches((header) => {
        const colIdx = this.headerMapping[header];
        const source = this.columns;
        return source[colIdx] as T[];
      })
    ).use(args);
  }

  getOrThrow<TReturn extends TableValue[] = TableValue[]>(
    header: TableValue
  ): TReturn;
  getOrThrow<TReturn extends TableValue = TableValue>(
    header: TableValue,
    column: number
  ): TReturn;

  @Bind
  getOrThrow(header: string, column?: number): TableValue | TableValue[] {
    const result = this.get(header, column as number);
    if (result === undefined) {
      const colSug = column !== undefined ? ` at column ${column}` : "";
      const maxSize = Math.max(...this.columns.map((col) => col.length));
      const maxSizeSlug = ` (max size ${maxSize})`;
      throw new Error(`Could not find row ${header}${colSug}${maxSizeSlug}}`);
    }
    return result;
  }
  private handleError(
    rowIdx: number,
    source: readonly TableValue[][],
    header: string,
    column: number
  ) {
    if (rowIdx > source.length) {
      const maxLength = source.length - 1;
      const msg = `Could not find column ${header} row ${column}. Max length for row is ${maxLength} on ${source}.`;
      throw new Error(msg);
    }
  }
}
